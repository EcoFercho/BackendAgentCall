import { Injectable } from "@nestjs/common";
import { SaveGmailConfigCommand } from "../../application/contracts/save-gmail-config.command";
import { TestGmailConnectionCommand } from "../../application/contracts/test-gmail-connection.command";
import { MailInboxPort } from "../../application/ports/mail-inbox.port";
import { GmailService } from "../services/gmail.service";

@Injectable()
export class GmailInboxAdapter implements MailInboxPort {
  constructor(private readonly gmailService: GmailService) {}

  async getConfig() {
    return this.gmailService.getConfig();
  }

  async saveConfig(command: SaveGmailConfigCommand) {
    return this.gmailService.saveConfig(command);
  }

  async testConnection(command: TestGmailConnectionCommand) {
    return this.gmailService.testConnection(command);
  }

  async getApprovedMessages() {
    return this.gmailService.getApprovedMessages();
  }

  async getClassifiedMessages() {
    return this.gmailService.getClassifiedMessages();
  }

  async getMessageSummary() {
    return this.gmailService.getMessageSummary();
  }

  async generateIncidentSummary(messageId: string) {
    return this.gmailService.generateIncidentSummary(messageId);
  }

  async syncInbox() {
    return this.gmailService.syncInbox();
  }
}
