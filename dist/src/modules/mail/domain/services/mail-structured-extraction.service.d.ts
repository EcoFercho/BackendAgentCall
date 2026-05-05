type ExtractionInput = {
    detectedClientName?: string | null;
    fromName?: string | null;
    fromEmail: string;
    subject?: string | null;
    bodyText?: string | null;
};
export type StructuredMailExtraction = {
    extractedClientName: string;
    incidentSummary: string;
    estimatedPriority: "ALTA" | "MEDIA" | "BAJA";
    mainContext: string;
    voiceText: string;
    extractionEngine: string;
};
export declare class MailStructuredExtractionService {
    extract(input: ExtractionInput): StructuredMailExtraction;
    private resolveClientName;
    private buildIncidentSummary;
    private buildContext;
    private estimatePriority;
    private buildVoiceText;
    private extractImportantLines;
    private normalizeText;
    private compactText;
}
export {};
