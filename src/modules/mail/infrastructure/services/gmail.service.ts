import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EmailMessage, GmailConfig, MessageStatus, Prisma } from "@prisma/client";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NotificationsGateway } from "../../../../notifications/notifications.gateway";
import { PrismaService } from "../../../../prisma/prisma.service";
import { LlmConfigService } from "../../../llm-config/llm-config.service";
import { SaveGmailConfigCommand } from "../../application/contracts/save-gmail-config.command";
import { TestGmailConnectionCommand } from "../../application/contracts/test-gmail-connection.command";
import { EmailClassificationService } from "../../domain/services/email-classification.service";
import { SpamFilterService } from "../../domain/services/spam-filter.service";

type MailboxTarget = {
  path: string;
  source: "INBOX" | "SPAM";
};

type SyncInboxResult = {
  synced: number;
  approved: number;
  irrelevant: number;
  spam: number;
};

const DASHBOARD_MESSAGES_LIMIT = 200;
const MAILBOX_RECENT_WINDOW_SIZE = 20;
const BACKGROUND_SYNC_INTERVAL_MS = 30000;
const BACKGROUND_SYNC_INITIAL_DELAY_MS = 5000;
const IMAP_SYNC_TIMEOUT_MS = 45000;

@Injectable()
export class GmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailService.name);
  private activeSyncPromise: Promise<SyncInboxResult> | null = null;
  private backgroundSyncTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly spamFilterService: SpamFilterService,
    private readonly emailClassificationService: EmailClassificationService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly llmConfigService: LlmConfigService
  ) {}

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

  async saveConfig(command: SaveGmailConfigCommand) {
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

  async testConnection(command: TestGmailConnectionCommand) {
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
      await this.withTimeout(
        client.mailboxOpen("INBOX", { readOnly: true }),
        IMAP_SYNC_TIMEOUT_MS,
        () => client.close()
      );
      return {
        ok: true,
        message: "Conexion IMAP exitosa con Gmail"
      };
    } finally {
      await this.closeClient(client);
    }
  }

  async getApprovedMessages() {
    return this.prisma.emailMessage.findMany({
      where: { status: MessageStatus.APPROVED },
      orderBy: { receivedAt: "desc" },
      take: DASHBOARD_MESSAGES_LIMIT
    });
  }

  async getClassifiedMessages() {
    return this.prisma.emailMessage.findMany({
      where: {
        status: {
          in: [MessageStatus.APPROVED, MessageStatus.IRRELEVANT, MessageStatus.SPAM]
        }
      },
      orderBy: { receivedAt: "desc" },
      take: DASHBOARD_MESSAGES_LIMIT
    });
  }

  async getMessageSummary() {
    const where = {
      status: {
        in: [MessageStatus.APPROVED, MessageStatus.IRRELEVANT, MessageStatus.SPAM]
      }
    } satisfies Prisma.EmailMessageWhereInput;

    const [classifiedCount, approvedCount] = await Promise.all([
      this.prisma.emailMessage.count({ where }),
      this.prisma.emailMessage.count({
        where: { status: MessageStatus.APPROVED }
      })
    ]);

    return {
      classifiedCount,
      approvedCount,
      dashboardLimit: DASHBOARD_MESSAGES_LIMIT
    };
  }

  async generateIncidentSummary(messageId: string) {
    const message = await this.prisma.emailMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundException("No se encontro el correo solicitado.");
    }

    if (message.status !== MessageStatus.APPROVED) {
      throw new BadRequestException("Solo se puede generar incidente para correos relevantes.");
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
    } finally {
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

  private async runBackgroundSync() {
    try {
      await this.syncInbox();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown background sync error";
      this.logger.warn(`Background IMAP sync failed: ${message}`);
    }
  }

  private async runSyncInbox(): Promise<SyncInboxResult> {
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

    return this.withTimeout(
      (async () => {
        try {
          await client.connect();
          const mailboxes = await this.resolveMailboxes(client);
          const messagesById = new Map<string, Prisma.EmailMessageUncheckedCreateInput>();
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

            if (saved.status === MessageStatus.APPROVED) {
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
            approved: messages.filter((message) => message.status === MessageStatus.APPROVED).length,
            irrelevant: messages.filter((message) => message.status === MessageStatus.IRRELEVANT).length,
            spam: messages.filter((message) => message.status === MessageStatus.SPAM).length
          };
        } finally {
          await this.closeClient(client);
        }
      })(),
      IMAP_SYNC_TIMEOUT_MS,
      () => client.close()
    );
  }

  private createImapClient({
    host,
    port,
    secure,
    user,
    pass
  }: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  }) {
    const client = new ImapFlow({
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

  private async closeClient(client: ImapFlow) {
    try {
      const logoutPromise = client.logout().catch(() => undefined);
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          client.close();
          resolve();
        }, 1500);
      });

      await Promise.race([logoutPromise, timeoutPromise]);
    } catch {
      client.close();
    }
  }

  private encryptAppPassword(value: string) {
    const key = this.getSecretKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  }

  private decryptAppPassword(value: string) {
    if (!value.includes(":")) {
      return value;
    }

    const key = this.getSecretKey();
    const [ivHex, encryptedHex] = value.split(":");
    const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final()
    ]);
    return decrypted.toString("utf8");
  }

  private getSecretKey() {
    const secret = process.env.JWT_SECRET ?? "change-me-now";
    return createHash("sha256").update(secret).digest();
  }

  private async resolveMailboxes(client: ImapFlow) {
    return [
      {
        path: "INBOX",
        source: "INBOX"
      }
    ] satisfies MailboxTarget[];
  }

  private async readMailboxMessages(
    client: ImapFlow,
    mailbox: MailboxTarget,
    config: GmailConfig
  ) {
    const messages: Prisma.EmailMessageUncheckedCreateInput[] = [];

    await this.withTimeout(
      this.openMailboxForFetch(client, mailbox.path),
      IMAP_SYNC_TIMEOUT_MS,
      () => client.close()
    );

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
      const spamReason =
        mailbox.source === "SPAM"
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

  private async extractMessageContent(source?: Buffer) {
    if (!source?.length) {
      return {
        snippet: "",
        bodyText: ""
      };
    }

    try {
      const parsed = await simpleParser(source, {
        skipImageLinks: true,
        skipTextLinks: true
      });
      const bodyText = this.normalizeMessageText(parsed.text || this.htmlToPlainText(parsed.html || ""));

      return {
        snippet: this.createSnippet(bodyText),
        bodyText
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown mail parsing error";
      this.logger.warn(`No se pudo parsear el contenido del correo: ${message}`);

      const fallbackBody = this.extractBodyFromRawSource(source);
      return {
        snippet: this.createSnippet(fallbackBody),
        bodyText: fallbackBody
      };
    }
  }

  private extractBodyFromRawSource(source: Buffer) {
    const raw = source.toString("utf8");
    const separatorIndex = raw.search(/\r?\n\r?\n/);
    const body = separatorIndex >= 0 ? raw.slice(separatorIndex) : raw;
    return this.normalizeMessageText(body);
  }

  private htmlToPlainText(value: string) {
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

  private normalizeMessageText(value: string) {
    return value
      .replace(/\r\n/g, "\n")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private createSnippet(value: string) {
    const compact = value.replace(/\s+/g, " ").trim();
    if (!compact) {
      return "";
    }

    return compact.length > 280 ? `${compact.slice(0, 280).trim()}...` : compact;
  }

  private buildIncidentSource(
    message: Pick<
      Prisma.EmailMessageUncheckedCreateInput,
      "fromName" | "fromEmail" | "subject" | "receivedAt" | "bodyText" | "snippet" | "detectedClientName" | "classificationReason"
    >
  ) {
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

    sections.push(
      "Correo completo:",
      message.bodyText?.trim() || message.snippet?.trim() || "Sin contenido disponible."
    );

    return sections.join("\n");
  }

  private async ensureIncidentSummary(message: EmailMessage, options?: { silent?: boolean }) {
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
    } catch (error) {
      if (!options?.silent) {
        throw error;
      }

      const messageText = error instanceof Error ? error.message : "No se pudo generar incidente";
      this.logger.warn(`No se pudo generar incidente para ${message.gmailMessageId}: ${messageText}`);
      return message;
    }
  }

  private async openMailboxForFetch(client: ImapFlow, path: string) {
    const imapClient = client as ImapFlow & {
      exec: (
        command: string,
        attributes: Array<{ type: string; value: string }>,
        options: {
          untagged: {
            OK: (untagged: {
              attributes?: Array<{ value?: string; section?: Array<{ type: string; value?: string }> }>;
            }) => Promise<void>;
            FLAGS: (untagged: { attributes?: Array<Array<{ value?: string }>> }) => Promise<void>;
            EXISTS: (untagged: { command?: string }) => Promise<void>;
          };
        }
      ) => Promise<{
        response: {
          attributes: Array<{ value?: string; section?: Array<{ type: string; value?: string }> }>;
        };
        next: () => void;
      }>;
      mailbox: {
        path: string;
        exists: number;
        flags?: Set<string>;
        permanentFlags?: Set<string>;
        uidNext?: number;
        uidValidity?: bigint;
        highestModseq?: bigint;
        readOnly?: boolean;
        noModseq?: boolean;
      } | null;
      currentSelectCommand?: unknown;
      state: number;
      states: {
        AUTHENTICATED: number;
        SELECTED: number;
      };
    };

    const mailboxState: {
      path: string;
      delimiter: string;
      exists: number;
      flags: Set<string>;
      permanentFlags?: Set<string>;
      uidNext: number;
      uidValidity: bigint;
      highestModseq?: bigint;
      readOnly?: boolean;
      noModseq?: boolean;
    } = {
      path,
      exists: 0,
      delimiter: "/",
      flags: new Set(),
      uidValidity: 0n,
      uidNext: 0
    };

    const response = await imapClient.exec(
      "EXAMINE",
      [{ type: "ATOM", value: path }],
      {
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
            const value =
              section.length > 1 && typeof section[1]?.value === "string"
                ? section[1].value
                : Array.isArray(section[1])
                  ? section[1]
                      .map((entry) => (typeof entry.value === "string" ? entry.value : null))
                      .filter((entry): entry is string => Boolean(entry))
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
              .filter((flag): flag is string => Boolean(flag));

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
      }
    );

    const responseSection = !response.response.attributes[0]?.value
      ? response.response.attributes[0]?.section
      : undefined;
    if (
      responseSection?.length &&
      responseSection[0].type === "ATOM" &&
      typeof responseSection[0].value === "string"
    ) {
      mailboxState.readOnly = responseSection[0].value.toUpperCase() === "READ-ONLY";
    }

    imapClient.mailbox = mailboxState;
    imapClient.currentSelectCommand = false;
    imapClient.state = imapClient.states.SELECTED;
    response.next();

    return mailboxState;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout?: () => void): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            onTimeout?.();
            reject(new Error(`La sincronizacion IMAP excedio el limite de ${Math.round(timeoutMs / 1000)}s`));
          }, timeoutMs);
        })
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private normalizeRuleConfig(command: SaveGmailConfigCommand) {
    return {
      allowedDomains: this.normalizeStringArray(command.allowedDomains, "domain"),
      allowedSenders: this.normalizeStringArray(command.allowedSenders, "email"),
      clientKeywords: this.normalizeStringArray(command.clientKeywords),
      incidentKeywords: this.normalizeStringArray(command.incidentKeywords),
      blockedKeywords: this.normalizeStringArray(command.blockedKeywords)
    };
  }

  private normalizeStringArray(values?: string[], mode: "plain" | "domain" | "email" = "plain") {
    if (!values?.length) {
      return [];
    }

    return Array.from(
      new Set(
        values
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
          })
      )
    );
  }

  private mergeLabels(existingLabels: string[], extraLabels: string[]) {
    return Array.from(new Set([...existingLabels, ...extraLabels]));
  }

  private mergeReasons(existingReason: string | null, extraReason: string) {
    return existingReason ? `${existingReason}; ${extraReason}` : extraReason;
  }
}
