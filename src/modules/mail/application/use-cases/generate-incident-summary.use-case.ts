import { Inject, Injectable } from "@nestjs/common";
import { MAIL_INBOX_PORT, MailInboxPort } from "../ports/mail-inbox.port";

@Injectable()
export class GenerateIncidentSummaryUseCase {
  constructor(@Inject(MAIL_INBOX_PORT) private readonly mailInboxPort: MailInboxPort) {}

  execute(messageId: string) {
    return this.mailInboxPort.generateIncidentSummary(messageId);
  }
}
