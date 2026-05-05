import { SaveGmailConfigCommand } from "../contracts/save-gmail-config.command";
import { TestGmailConnectionCommand } from "../contracts/test-gmail-connection.command";

export const MAIL_INBOX_PORT = Symbol("MAIL_INBOX_PORT");

export interface MailInboxPort {
  getConfig(): Promise<unknown>;
  saveConfig(command: SaveGmailConfigCommand): Promise<unknown>;
  testConnection(command: TestGmailConnectionCommand): Promise<unknown>;
  getApprovedMessages(): Promise<unknown>;
  getClassifiedMessages(): Promise<unknown>;
  getMessageSummary(): Promise<unknown>;
  generateIncidentSummary(messageId: string): Promise<unknown>;
  syncInbox(): Promise<unknown>;
}
