"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const node_crypto_1 = require("node:crypto");
const notifications_gateway_1 = require("../../../../notifications/notifications.gateway");
const prisma_service_1 = require("../../../../prisma/prisma.service");
const llm_config_service_1 = require("../../../llm-config/llm-config.service");
const email_classification_service_1 = require("../../domain/services/email-classification.service");
const spam_filter_service_1 = require("../../domain/services/spam-filter.service");
const DASHBOARD_MESSAGES_LIMIT = 200;
const MAILBOX_RECENT_WINDOW_SIZE = 20;
const BACKGROUND_SYNC_INTERVAL_MS = 30000;
const BACKGROUND_SYNC_INITIAL_DELAY_MS = 5000;
const IMAP_SYNC_TIMEOUT_MS = 45000;
let GmailService = GmailService_1 = class GmailService {
    constructor(prisma, spamFilterService, emailClassificationService, notificationsGateway, llmConfigService) {
        this.prisma = prisma;
        this.spamFilterService = spamFilterService;
        this.emailClassificationService = emailClassificationService;
        this.notificationsGateway = notificationsGateway;
        this.llmConfigService = llmConfigService;
        this.logger = new common_1.Logger(GmailService_1.name);
        this.activeSyncPromise = null;
        this.backgroundSyncTimer = null;
    }
    async getConfig() {
        const config = await this.prisma.gmailConfig.findFirst({
            orderBy: { createdAt: "asc" }
        });
        if (!config) {
            return null;
        }
        return {
            ...config,
            appPassword: undefined
        };
    }
    async saveConfig(command) {
        const normalizedPassword = command.appPassword?.replace(/\s+/g, "");
        const encryptedPassword = normalizedPassword
            ? this.encryptAppPassword(normalizedPassword)
            : undefined;
        const normalizedRules = this.normalizeRuleConfig(command);
        return this.prisma.gmailConfig.upsert({
            where: { baseEmail: command.baseEmail },
            update: {
                ...(encryptedPassword ? { appPassword: encryptedPassword } : {}),
                host: command.host,
                port: command.port,
                secure: command.secure,
                spamScoreLimit: command.spamScoreLimit,
                ...normalizedRules
            },
            create: {
                baseEmail: command.baseEmail,
                appPassword: encryptedPassword,
                host: command.host,
                port: command.port,
                secure: command.secure,
                spamScoreLimit: command.spamScoreLimit,
                ...normalizedRules
            }
        });
    }
    async testConnection(command) {
        const normalizedPassword = command.appPassword?.replace(/\s+/g, "") ?? "";
        const client = this.createImapClient({
            host: command.host,
            port: command.port,
            secure: command.secure,
            user: command.baseEmail,
            pass: normalizedPassword
        });
        try {
            await this.withTimeout(client.connect(), IMAP_SYNC_TIMEOUT_MS, () => client.close());
            await this.withTimeout(client.mailboxOpen("INBOX", { readOnly: true }), IMAP_SYNC_TIMEOUT_MS, () => client.close());
            return {
                ok: true,
                message: "Conexion IMAP exitosa con Gmail"
            };
        }
        finally {
            await this.closeClient(client);
        }
    }
    async getApprovedMessages() {
        return this.prisma.emailMessage.findMany({
            where: { status: client_1.MessageStatus.APPROVED },
            orderBy: { receivedAt: "desc" },
            take: DASHBOARD_MESSAGES_LIMIT
        });
    }
    async getClassifiedMessages() {
        return this.prisma.emailMessage.findMany({
            where: {
                status: {
                    in: [client_1.MessageStatus.APPROVED, client_1.MessageStatus.IRRELEVANT, client_1.MessageStatus.SPAM]
                }
            },
            orderBy: { receivedAt: "desc" },
            take: DASHBOARD_MESSAGES_LIMIT
        });
    }
    async getMessageSummary() {
        const where = {
            status: {
                in: [client_1.MessageStatus.APPROVED, client_1.MessageStatus.IRRELEVANT, client_1.MessageStatus.SPAM]
            }
        };
        const [classifiedCount, approvedCount] = await Promise.all([
            this.prisma.emailMessage.count({ where }),
            this.prisma.emailMessage.count({
                where: { status: client_1.MessageStatus.APPROVED }
            })
        ]);
        return {
            classifiedCount,
            approvedCount,
            dashboardLimit: DASHBOARD_MESSAGES_LIMIT
        };
    }
    async generateIncidentSummary(messageId) {
        const message = await this.prisma.emailMessage.findUnique({
            where: { id: messageId }
        });
        if (!message) {
            throw new common_1.NotFoundException("No se encontro el correo solicitado.");
        }
        if (message.status !== client_1.MessageStatus.APPROVED) {
            throw new common_1.BadRequestException("Solo se puede generar incidente para correos relevantes.");
        }
        return this.ensureIncidentSummary(message);
    }
    async syncInbox() {
        if (this.activeSyncPromise) {
            return this.activeSyncPromise;
        }
        this.activeSyncPromise = this.runSyncInbox();
        try {
            return await this.activeSyncPromise;
        }
        finally {
            this.activeSyncPromise = null;
        }
    }
    onModuleInit() {
        setTimeout(() => {
            void this.runBackgroundSync();
        }, BACKGROUND_SYNC_INITIAL_DELAY_MS);
        this.backgroundSyncTimer = setInterval(() => {
            void this.runBackgroundSync();
        }, BACKGROUND_SYNC_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.backgroundSyncTimer) {
            clearInterval(this.backgroundSyncTimer);
            this.backgroundSyncTimer = null;
        }
    }
    async runBackgroundSync() {
        try {
            await this.syncInbox();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown background sync error";
            this.logger.warn(`Background IMAP sync failed: ${message}`);
        }
    }
    async runSyncInbox() {
        const config = await this.prisma.gmailConfig.findFirst({
            orderBy: { createdAt: "asc" }
        });
        if (!config?.appPassword) {
            throw new Error("Falta configurar GMAIL_APP_PASSWORD o guardarlo desde el panel admin");
        }
        const decryptedPassword = this.decryptAppPassword(config.appPassword);
        const client = this.createImapClient({
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: config.baseEmail,
            pass: decryptedPassword
        });
        return this.withTimeout((async () => {
            try {
                await client.connect();
                const mailboxes = await this.resolveMailboxes(client);
                const messagesById = new Map();
                const syncStartedAt = new Date();
                for (const mailbox of mailboxes) {
                    const mailboxMessages = await this.readMailboxMessages(client, mailbox, config);
                    for (const message of mailboxMessages) {
                        messagesById.set(message.gmailMessageId, message);
                    }
                }
                const messages = Array.from(messagesById.values()).sort((left, right) => {
                    return new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime();
                });
                for (const email of messages) {
                    const saved = await this.prisma.emailMessage.upsert({
                        where: { gmailMessageId: email.gmailMessageId },
                        update: email,
                        create: email
                    });
                    if (saved.status === client_1.MessageStatus.APPROVED) {
                        const messageWithIncident = await this.ensureIncidentSummary(saved, { silent: true });
                        this.notificationsGateway.broadcastTicker(messageWithIncident);
                    }
                }
                await this.prisma.gmailConfig.update({
                    where: { id: config.id },
                    data: { lastSyncAt: syncStartedAt, lastConnectionAt: syncStartedAt }
                });
                return {
                    synced: messages.length,
                    approved: messages.filter((message) => message.status === client_1.MessageStatus.APPROVED).length,
                    irrelevant: messages.filter((message) => message.status === client_1.MessageStatus.IRRELEVANT).length,
                    spam: messages.filter((message) => message.status === client_1.MessageStatus.SPAM).length
                };
            }
            finally {
                await this.closeClient(client);
            }
        })(), IMAP_SYNC_TIMEOUT_MS, () => client.close());
    }
    createImapClient({ host, port, secure, user, pass }) {
        const client = new imapflow_1.ImapFlow({
            host,
            port,
            secure,
            disableAutoIdle: true,
            disableCompression: true,
            disableAutoEnable: true,
            auth: {
                user,
                pass
            }
        });
        client.on("error", (error) => {
            this.logger.warn(`IMAP error: ${error.message}`);
        });
        return client;
    }
    async closeClient(client) {
        try {
            const logoutPromise = client.logout().catch(() => undefined);
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    client.close();
                    resolve();
                }, 1500);
            });
            await Promise.race([logoutPromise, timeoutPromise]);
        }
        catch {
            client.close();
        }
    }
    encryptAppPassword(value) {
        const key = this.getSecretKey();
        const iv = (0, node_crypto_1.randomBytes)(16);
        const cipher = (0, node_crypto_1.createCipheriv)("aes-256-cbc", key, iv);
        const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    }
    decryptAppPassword(value) {
        if (!value.includes(":")) {
            return value;
        }
        const key = this.getSecretKey();
        const [ivHex, encryptedHex] = value.split(":");
        const decipher = (0, node_crypto_1.createDecipheriv)("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, "hex")),
            decipher.final()
        ]);
        return decrypted.toString("utf8");
    }
    getSecretKey() {
        const secret = process.env.JWT_SECRET ?? "change-me-now";
        return (0, node_crypto_1.createHash)("sha256").update(secret).digest();
    }
    async resolveMailboxes(client) {
        return [
            {
                path: "INBOX",
                source: "INBOX"
            }
        ];
    }
    async readMailboxMessages(client, mailbox, config) {
        const messages = [];
        await this.withTimeout(this.openMailboxForFetch(client, mailbox.path), IMAP_SYNC_TIMEOUT_MS, () => client.close());
        const totalMessages = client.mailbox ? client.mailbox.exists : 0;
        if (!totalMessages) {
            return messages;
        }
        const start = Math.max(1, totalMessages - MAILBOX_RECENT_WINDOW_SIZE + 1);
        const range = `${start}:*`;
        for await (const message of client.fetch(range, {
            envelope: true,
            labels: true,
            internalDate: true,
            source: true
        })) {
            const envelopeFrom = message.envelope?.from?.[0];
            const fromAddress = envelopeFrom?.address;
            if (!fromAddress) {
                continue;
            }
            const labels = message.labels ? Array.from(message.labels) : [];
            const subject = message.envelope?.subject ?? "(sin asunto)";
            const messageId = message.envelope?.messageId ?? `${mailbox.path}:${message.uid}`;
            const content = await this.extractMessageContent(message.source);
            const normalizedLabels = mailbox.source === "SPAM" ? this.mergeLabels(labels, ["SPAM"]) : labels;
            const spamCheck = this.spamFilterService.evaluate({
                labels: normalizedLabels,
                fromEmail: fromAddress,
                subject,
                bodyText: content.bodyText
            });
            const spamReason = mailbox.source === "SPAM"
                ? this.mergeReasons(spamCheck.reasons, "Detectado desde carpeta Spam de Gmail")
                : spamCheck.reasons;
            const classification = this.emailClassificationService.evaluate({
                labels: normalizedLabels,
                fromName: envelopeFrom.name ?? null,
                fromEmail: fromAddress,
                subject,
                bodyText: content.bodyText,
                config,
                spamScore: mailbox.source === "SPAM" ? Math.max(spamCheck.score, config.spamScoreLimit) : spamCheck.score,
                spamScoreLimit: config.spamScoreLimit,
                spamReason
            });
            messages.push({
                gmailMessageId: messageId,
                fromName: envelopeFrom.name ?? null,
                fromEmail: fromAddress,
                subject,
                snippet: content.snippet,
                bodyText: content.bodyText,
                receivedAt: message.internalDate ?? new Date(),
                labels: normalizedLabels,
                spamScore: spamCheck.score,
                spamReason,
                status: classification.status,
                classificationReason: classification.classificationReason,
                classificationConfidence: classification.classificationConfidence,
                matchedRules: classification.matchedRules,
                detectedClientName: classification.detectedClientName
            });
        }
        return messages;
    }
    async extractMessageContent(source) {
        if (!source?.length) {
            return {
                snippet: "",
                bodyText: ""
            };
        }
        try {
            const parsed = await (0, mailparser_1.simpleParser)(source, {
                skipImageLinks: true,
                skipTextLinks: true
            });
            const bodyText = this.normalizeMessageText(parsed.text || this.htmlToPlainText(parsed.html || ""));
            return {
                snippet: this.createSnippet(bodyText),
                bodyText
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown mail parsing error";
            this.logger.warn(`No se pudo parsear el contenido del correo: ${message}`);
            const fallbackBody = this.extractBodyFromRawSource(source);
            return {
                snippet: this.createSnippet(fallbackBody),
                bodyText: fallbackBody
            };
        }
    }
    extractBodyFromRawSource(source) {
        const raw = source.toString("utf8");
        const separatorIndex = raw.search(/\r?\n\r?\n/);
        const body = separatorIndex >= 0 ? raw.slice(separatorIndex) : raw;
        return this.normalizeMessageText(body);
    }
    htmlToPlainText(value) {
        if (!value) {
            return "";
        }
        return value
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(p|div|li|tr|h[1-6]|table|section|article)>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&#39;/gi, "'")
            .replace(/&quot;/gi, "\"");
    }
    normalizeMessageText(value) {
        return value
            .replace(/\r\n/g, "\n")
            .replace(/\u0000/g, "")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }
    createSnippet(value) {
        const compact = value.replace(/\s+/g, " ").trim();
        if (!compact) {
            return "";
        }
        return compact.length > 280 ? `${compact.slice(0, 280).trim()}...` : compact;
    }
    buildIncidentSource(message) {
        const sections = [
            `Asunto: ${message.subject || "(sin asunto)"}`,
            `Remitente: ${message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail}`,
            `Recibido: ${new Date(message.receivedAt).toISOString()}`
        ];
        if (message.detectedClientName) {
            sections.push(`Cliente detectado: ${message.detectedClientName}`);
        }
        if (message.classificationReason) {
            sections.push(`Contexto de clasificacion: ${message.classificationReason}`);
        }
        sections.push("Correo completo:", message.bodyText?.trim() || message.snippet?.trim() || "Sin contenido disponible.");
        return sections.join("\n");
    }
    async ensureIncidentSummary(message, options) {
        if (message.incidentSummary?.trim()) {
            return message;
        }
        const sourceText = this.buildIncidentSource(message);
        try {
            const generated = await this.llmConfigService.generateIncidentSummary(sourceText);
            return this.prisma.emailMessage.update({
                where: { id: message.id },
                data: {
                    incidentSummary: generated.summary,
                    incidentSummaryModel: generated.model,
                    incidentSummaryGeneratedAt: new Date()
                }
            });
        }
        catch (error) {
            if (!options?.silent) {
                throw error;
            }
            const messageText = error instanceof Error ? error.message : "No se pudo generar incidente";
            this.logger.warn(`No se pudo generar incidente para ${message.gmailMessageId}: ${messageText}`);
            return message;
        }
    }
    async openMailboxForFetch(client, path) {
        const imapClient = client;
        const mailboxState = {
            path,
            exists: 0,
            delimiter: "/",
            flags: new Set(),
            uidValidity: 0n,
            uidNext: 0
        };
        const response = await imapClient.exec("EXAMINE", [{ type: "ATOM", value: path }], {
            untagged: {
                OK: async (untagged) => {
                    if (!untagged.attributes?.length) {
                        return;
                    }
                    const section = !untagged.attributes[0].value ? untagged.attributes[0].section : undefined;
                    if (!section?.length || section[0].type !== "ATOM" || typeof section[0].value !== "string") {
                        return;
                    }
                    const key = section[0].value.toLowerCase();
                    const value = section.length > 1 && typeof section[1]?.value === "string"
                        ? section[1].value
                        : Array.isArray(section[1])
                            ? section[1]
                                .map((entry) => (typeof entry.value === "string" ? entry.value : null))
                                .filter((entry) => Boolean(entry))
                            : null;
                    switch (key) {
                        case "highestmodseq":
                            if (typeof value === "string" && /^[0-9]+$/.test(value)) {
                                mailboxState.highestModseq = BigInt(value);
                            }
                            break;
                        case "permanentflags":
                            mailboxState.permanentFlags = new Set(Array.isArray(value) ? value : []);
                            break;
                        case "uidnext":
                            if (typeof value === "string") {
                                mailboxState.uidNext = Number(value);
                            }
                            break;
                        case "uidvalidity":
                            if (typeof value === "string" && /^[0-9]+$/.test(value)) {
                                mailboxState.uidValidity = BigInt(value);
                            }
                            break;
                        case "nomodseq":
                            mailboxState.noModseq = true;
                            break;
                    }
                },
                FLAGS: async (untagged) => {
                    const flags = untagged.attributes?.[0]
                        ?.map((flag) => (typeof flag.value === "string" ? flag.value : null))
                        .filter((flag) => Boolean(flag));
                    if (flags?.length) {
                        mailboxState.flags = new Set(flags);
                    }
                },
                EXISTS: async (untagged) => {
                    const exists = Number(untagged.command);
                    if (!Number.isNaN(exists)) {
                        mailboxState.exists = exists;
                    }
                }
            }
        });
        const responseSection = !response.response.attributes[0]?.value
            ? response.response.attributes[0]?.section
            : undefined;
        if (responseSection?.length &&
            responseSection[0].type === "ATOM" &&
            typeof responseSection[0].value === "string") {
            mailboxState.readOnly = responseSection[0].value.toUpperCase() === "READ-ONLY";
        }
        imapClient.mailbox = mailboxState;
        imapClient.currentSelectCommand = false;
        imapClient.state = imapClient.states.SELECTED;
        response.next();
        return mailboxState;
    }
    async withTimeout(promise, timeoutMs, onTimeout) {
        let timeoutHandle = null;
        try {
            return await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timeoutHandle = setTimeout(() => {
                        onTimeout?.();
                        reject(new Error(`La sincronizacion IMAP excedio el limite de ${Math.round(timeoutMs / 1000)}s`));
                    }, timeoutMs);
                })
            ]);
        }
        finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }
    }
    normalizeRuleConfig(command) {
        return {
            allowedDomains: this.normalizeStringArray(command.allowedDomains, "domain"),
            allowedSenders: this.normalizeStringArray(command.allowedSenders, "email"),
            clientKeywords: this.normalizeStringArray(command.clientKeywords),
            incidentKeywords: this.normalizeStringArray(command.incidentKeywords),
            blockedKeywords: this.normalizeStringArray(command.blockedKeywords)
        };
    }
    normalizeStringArray(values, mode = "plain") {
        if (!values?.length) {
            return [];
        }
        return Array.from(new Set(values
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
            .map((value) => {
            if (mode === "domain") {
                return value.replace(/^@/, "");
            }
            if (mode === "email") {
                return value;
            }
            return value;
        })));
    }
    mergeLabels(existingLabels, extraLabels) {
        return Array.from(new Set([...existingLabels, ...extraLabels]));
    }
    mergeReasons(existingReason, extraReason) {
        return existingReason ? `${existingReason}; ${extraReason}` : extraReason;
    }
};
exports.GmailService = GmailService;
exports.GmailService = GmailService = GmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        spam_filter_service_1.SpamFilterService,
        email_classification_service_1.EmailClassificationService,
        notifications_gateway_1.NotificationsGateway,
        llm_config_service_1.LlmConfigService])
], GmailService);
//# sourceMappingURL=gmail.service.js.map