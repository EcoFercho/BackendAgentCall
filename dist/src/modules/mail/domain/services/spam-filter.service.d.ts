export interface SpamCheckInput {
    labels: string[];
    fromEmail: string;
    subject?: string | null;
    bodyText?: string | null;
}
export declare class SpamFilterService {
    evaluate(input: SpamCheckInput): {
        score: number;
        reasons: string;
    };
}
