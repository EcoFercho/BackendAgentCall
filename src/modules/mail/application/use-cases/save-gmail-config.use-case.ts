import { Inject, Injectable } from "@nestjs/common";
import { SaveGmailConfigCommand } from "../contracts/save-gmail-config.command";
import { MAIL_INBOX_PORT, MailInboxPort } from "../ports/mail-inbox.port";

@Injectable()
export class SaveGmailConfigUseCase {
  constructor(@Inject(MAIL_INBOX_PORT) private readonly mailInboxPort: MailInboxPort) {}

  async execute(command: SaveGmailConfigCommand) {
    return this.mailInboxPort.saveConfig(command);
  }
}
