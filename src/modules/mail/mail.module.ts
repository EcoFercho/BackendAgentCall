import { Module } from "@nestjs/common";
import { NotificationsModule } from "../../notifications/notifications.module";
import { MAIL_INBOX_PORT } from "./application/ports/mail-inbox.port";
import { GetGmailConfigUseCase } from "./application/use-cases/get-gmail-config.use-case";
import { GetMessageSummaryUseCase } from "./application/use-cases/get-message-summary.use-case";
import { ListApprovedMessagesUseCase } from "./application/use-cases/list-approved-messages.use-case";
import { ListClassifiedMessagesUseCase } from "./application/use-cases/list-classified-messages.use-case";
import { SaveGmailConfigUseCase } from "./application/use-cases/save-gmail-config.use-case";
import { SyncGmailInboxUseCase } from "./application/use-cases/sync-gmail-inbox.use-case";
import { TestGmailConnectionUseCase } from "./application/use-cases/test-gmail-connection.use-case";
import { EmailClassificationService } from "./domain/services/email-classification.service";
import { SpamFilterService } from "./domain/services/spam-filter.service";
import { GmailInboxAdapter } from "./infrastructure/adapters/gmail-inbox.adapter";
import { GmailService } from "./infrastructure/services/gmail.service";
import { GmailController } from "./presentation/http/gmail.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [GmailController],
  providers: [
    GmailService,
    SpamFilterService,
    EmailClassificationService,
    GmailInboxAdapter,
    GetGmailConfigUseCase,
    GetMessageSummaryUseCase,
    SaveGmailConfigUseCase,
    TestGmailConnectionUseCase,
    ListApprovedMessagesUseCase,
    ListClassifiedMessagesUseCase,
    SyncGmailInboxUseCase,
    {
      provide: MAIL_INBOX_PORT,
      useExisting: GmailInboxAdapter
    }
  ]
})
export class MailModule {}
