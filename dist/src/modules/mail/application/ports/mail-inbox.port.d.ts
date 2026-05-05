import { SaveGmailConfigCommand } from "../contracts/save-gmail-config.command";
import { TestGmailConnectionCommand } from "../contracts/test-gmail-connection.command";
export declare const MAIL_INBOX_PORT: unique symbol;
export interface MailInboxPort {
    getConfig(): Promise<unknown>;
    saveConfig(command: SaveGmailConfigCommand): Promise<unknown>;
    testConnection(command: TestGmailConnectionCommand): Promise<unknown>;
    getApprovedMessages(): Promise<unknown>;
    getClassifiedMessages(): Promise<unknown>;
    getMessageSummary(): Promise<unknown>;
    syncInbox(): Promise<unknown>;
}
