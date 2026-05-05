export type SaveGmailConfigCommand = {
    baseEmail: string;
    appPassword?: string;
    host: string;
    port: number;
    secure: boolean;
    spamScoreLimit: number;
    allowedDomains?: string[];
    allowedSenders?: string[];
    clientKeywords?: string[];
    incidentKeywords?: string[];
    blockedKeywords?: string[];
};
