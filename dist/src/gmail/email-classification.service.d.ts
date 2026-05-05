import { GmailConfig, MessageStatus } from "@prisma/client";
import { SpamCheckInput } from "./spam-filter.service";
type ClassificationInput = Pick<SpamCheckInput, "fromEmail" | "subject" | "bodyText" | "labels"> & {
    fromName?: string | null;
    config: Pick<GmailConfig, "allowedDomains" | "allowedSenders" | "clientKeywords" | "incidentKeywords" | "blockedKeywords">;
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
export declare class EmailClassificationService {
    evaluate(input: ClassificationInput): ClassificationResult;
    private detectClientName;
    private mergeKeywords;
    private includesAny;
    private hasXocRelation;
    private toConfidence;
}
export {};
