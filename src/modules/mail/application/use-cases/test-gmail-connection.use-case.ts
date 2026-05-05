import { Inject, Injectable } from "@nestjs/common";
import { TestGmailConnectionCommand } from "../contracts/test-gmail-connection.command";
import { MAIL_INBOX_PORT, MailInboxPort } from "../ports/mail-inbox.port";

@Injectable()
export class TestGmailConnectionUseCase {
  constructor(@Inject(MAIL_INBOX_PORT) private readonly mailInboxPort: MailInboxPort) {}

  async execute(command: TestGmailConnectionCommand) {
    return this.mailInboxPort.testConnection(command);
  }
}
