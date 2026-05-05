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
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const prisma_service_1 = require("../prisma/prisma.service");
const email_classification_service_1 = require("./email-classification.service");
const spam_filter_service_1 = require("./spam-filter.service");
let GmailService = GmailService_1 = class GmailService {
    constructor(prisma, spamFilterService, emailClassificationService, notificationsGateway) {
        this.prisma = prisma;
        this.spamFilterService = spamFilterService;
        this.emailClassificationService = emailClassificationService;
        this.notificationsGateway = notificationsGateway;
        this.logger = new common_1.Logger(GmailService_1.name);
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
    async saveConfig(dto) {
        const normalizedPassword = dto.appPassword?.replace(/\s+/g, "");
        const encryptedPassword = normalizedPassword
            ? this.encryptAppPassword(normalizedPassword)
            : undefined;
        const normalizedRules = this.normalizeRuleConfig(dto);
        return this.prisma.gmailConfig.upsert({
            where: { baseEmail: dto.baseEmail },
            update: {
                ...(encryptedPassword ? { appPassword: encryptedPassword } : {}),
                host: dto.host,
                port: dto.port,
                secure: dto.secure,
                spamScoreLimit: dto.spamScoreLimit,
                ...normalizedRules
            },
            create: {
                baseEmail: dto.baseEmail,
                appPassword: encryptedPassword,
                host: dto.host,
                port: dto.port,
                secure: dto.secure,
                spamScoreLimit: dto.spamScoreLimit,
                ...normalizedRules
            }
        });
    }
    async testConnection(dto) {
        const normalizedPassword = dto.appPassword?.replace(/\s+/g, "") ?? "";
        const client = this.createImapClient({
            host: dto.host,
            port: dto.port,
            secure: dto.secure,
            user: dto.baseEmail,
            pass: normalizedPassword
        });
        try {
            await client.connect();
            await client.mailboxOpen("INBOX", { readOnly: true });
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
            take: 30
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
            take: 50
        });
    }
    async syncInbox() {
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
        try {
            await client.connect();
            const mailboxes = await this.resolveMailboxes(client);
            const messagesById = new Map();
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
                    this.notificationsGateway.broadcastTicker(saved);
                }
            }
            await this.prisma.gmailConfig.update({
                where: { id: config.id },
                data: { lastSyncAt: new Date(), lastConnectionAt: new Date() }
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
    }
    createImapClient({ host, port, secure, user, pass }) {
        const client = new imapflow_1.ImapFlow({
            host,
            port,
            secure,
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
            await client.logout();
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
        const listedMailboxes = await client.list();
        const inboxMailbox = listedMailboxes.find((mailbox) => mailbox.specialUse === "\\Inbox");
        const spamMailbox = listedMailboxes.find((mailbox) => mailbox.specialUse === "\\Junk");
        const mailboxes = [];
        mailboxes.push({
            path: inboxMailbox?.path ?? "INBOX",
            source: "INBOX"
        });
        if (spamMailbox?.path && spamMailbox.path !== inboxMailbox?.path) {
            mailboxes.push({
                path: spamMailbox.path,
                source: "SPAM"
            });
        }
        return mailboxes;
    }
    async readMailboxMessages(client, mailbox, config) {
        await client.mailboxOpen(mailbox.path, { readOnly: true });
        const lock = await client.getMailboxLock(mailbox.path);
        const messages = [];
        try {
            const total = client.mailbox ? client.mailbox.exists : 0;
            const start = total > 25 ? total - 24 : 1;
            for await (const message of client.fetch(`${start}:*`, {
                uid: true,
                source: true,
                labels: true,
                internalDate: true
            })) {
                if (!message.source) {
                    continue;
                }
                const parsed = (await (0, mailparser_1.simpleParser)(message.source));
                const fromAddress = parsed.from?.value?.[0];
                const labels = message.labels ? Array.from(message.labels) : [];
                if (!fromAddress?.address) {
                    continue;
                }
                const normalizedLabels = mailbox.source === "SPAM" ? this.mergeLabels(labels, ["SPAM"]) : labels;
                const spamCheck = this.spamFilterService.evaluate({
                    labels: normalizedLabels,
                    fromEmail: fromAddress.address,
                    subject: parsed.subject,
                    bodyText: parsed.text
                });
                const spamReason = mailbox.source === "SPAM"
                    ? this.mergeReasons(spamCheck.reasons, "Detectado desde carpeta Spam de Gmail")
                    : spamCheck.reasons;
                const classification = this.emailClassificationService.evaluate({
                    labels: normalizedLabels,
                    fromName: fromAddress.name ?? null,
                    fromEmail: fromAddress.address,
                    subject: parsed.subject,
                    bodyText: parsed.text,
                    config,
                    spamScore: mailbox.source === "SPAM" ? Math.max(spamCheck.score, config.spamScoreLimit) : spamCheck.score,
                    spamScoreLimit: config.spamScoreLimit,
                    spamReason
                });
                messages.push({
                    gmailMessageId: parsed.messageId ?? `${mailbox.path}:${message.uid}`,
                    fromName: fromAddress.name ?? null,
                    fromEmail: fromAddress.address,
                    subject: parsed.subject ?? "(sin asunto)",
                    snippet: (parsed.text ?? "").slice(0, 180),
                    bodyText: parsed.text ?? "",
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
        }
        finally {
            lock.release();
        }
        return messages;
    }
    normalizeRuleConfig(dto) {
        return {
            allowedDomains: this.normalizeStringArray(dto.allowedDomains, "domain"),
            allowedSenders: this.normalizeStringArray(dto.allowedSenders, "email"),
            clientKeywords: this.normalizeStringArray(dto.clientKeywords),
            incidentKeywords: this.normalizeStringArray(dto.incidentKeywords),
            blockedKeywords: this.normalizeStringArray(dto.blockedKeywords)
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
        notifications_gateway_1.NotificationsGateway])
], GmailService);
//# sourceMappingURL=gmail.service.js.map