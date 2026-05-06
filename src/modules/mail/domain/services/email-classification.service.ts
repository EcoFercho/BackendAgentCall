import { Injectable } from "@nestjs/common";
import { GmailConfig, MessageStatus } from "@prisma/client";
import { SpamCheckInput } from "./spam-filter.service";

type ClassificationInput = Pick<SpamCheckInput, "fromEmail" | "subject" | "bodyText" | "labels"> & {
  fromName?: string | null;
  config: Pick<
    GmailConfig,
    "allowedDomains" | "allowedSenders" | "clientKeywords" | "incidentKeywords" | "blockedKeywords"
  >;
  spamScore: number;
  spamScoreLimit: number;
  spamReason: string | null;
};

type ClassificationResult = {
  status: MessageStatus;
  classificationReason: string;
  classificationConfidence: number;
  matchedRules: string[];
  detectedClientName: string | null;
};

const XOC_INCIDENT_SENDER_PATTERN = /^incidente_xoc\d+@grupogoit\.com$/i;
const TEMP_ALLOWED_TEST_SENDERS = new Set(["engine.ia.lab@gmail.com"]);

@Injectable()
export class EmailClassificationService {
  evaluate(input: ClassificationInput): ClassificationResult {
    const sender = input.fromEmail.trim().toLowerCase();

    if (input.spamScore >= input.spamScoreLimit) {
      return {
        status: MessageStatus.SPAM,
        classificationReason: input.spamReason ?? "Clasificado como spam por el filtro base",
        classificationConfidence: 100,
        matchedRules: ["spam-score-limit"],
        detectedClientName: null
      };
    }

    if (XOC_INCIDENT_SENDER_PATTERN.test(sender) || TEMP_ALLOWED_TEST_SENDERS.has(sender)) {
      return {
        status: MessageStatus.APPROVED,
        classificationReason: TEMP_ALLOWED_TEST_SENDERS.has(sender)
          ? "Correo aprobado temporalmente para pruebas controladas"
          : "Correo aprobado por remitente operativo XOC reconocido",
        classificationConfidence: 99,
        matchedRules: [TEMP_ALLOWED_TEST_SENDERS.has(sender) ? "temporary-test-sender" : "xoc-incident-sender"],
        detectedClientName: null
      };
    }

    return {
      status: MessageStatus.IRRELEVANT,
      classificationReason: "Correo descartado: el remitente no coincide con el patron operativo XOC",
      classificationConfidence: 95,
      matchedRules: ["sender-pattern-mismatch"],
      detectedClientName: null
    };
  }
}
