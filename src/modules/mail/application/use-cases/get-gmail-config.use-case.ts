import { Inject, Injectable } from "@nestjs/common";
import { MAIL_INBOX_PORT, MailInboxPort } from "../ports/mail-inbox.port";

@Injectable()
export class GetGmailConfigUseCase {
  constructor(@Inject(MAIL_INBOX_PORT) private readonly mailInboxPort: MailInboxPort) {}

  async execute() {
    return this.mailInboxPort.getConfig();
  }
}
