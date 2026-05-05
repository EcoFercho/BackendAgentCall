import { GetGmailConfigUseCase } from "../../application/use-cases/get-gmail-config.use-case";
import { GetMessageSummaryUseCase } from "../../application/use-cases/get-message-summary.use-case";
import { ListApprovedMessagesUseCase } from "../../application/use-cases/list-approved-messages.use-case";
import { ListClassifiedMessagesUseCase } from "../../application/use-cases/list-classified-messages.use-case";
import { SaveGmailConfigUseCase } from "../../application/use-cases/save-gmail-config.use-case";
import { SyncGmailInboxUseCase } from "../../application/use-cases/sync-gmail-inbox.use-case";
import { TestGmailConnectionUseCase } from "../../application/use-cases/test-gmail-connection.use-case";
import { SaveGmailConfigDto } from "./dto/save-gmail-config.dto";
import { TestGmailConnectionDto } from "./dto/test-gmail-connection.dto";
export declare class GmailController {
    private readonly getGmailConfigUseCase;
    private readonly getMessageSummaryUseCase;
    private readonly saveGmailConfigUseCase;
    private readonly testGmailConnectionUseCase;
    private readonly listApprovedMessagesUseCase;
    private readonly listClassifiedMessagesUseCase;
    private readonly syncGmailInboxUseCase;
    constructor(getGmailConfigUseCase: GetGmailConfigUseCase, getMessageSummaryUseCase: GetMessageSummaryUseCase, saveGmailConfigUseCase: SaveGmailConfigUseCase, testGmailConnectionUseCase: TestGmailConnectionUseCase, listApprovedMessagesUseCase: ListApprovedMessagesUseCase, listClassifiedMessagesUseCase: ListClassifiedMessagesUseCase, syncGmailInboxUseCase: SyncGmailInboxUseCase);
    getConfig(): Promise<unknown>;
    saveConfig(body: SaveGmailConfigDto): Promise<unknown>;
    testConnection(body: TestGmailConnectionDto): Promise<unknown>;
    getApprovedMessages(): Promise<unknown>;
    getClassifiedMessages(): Promise<unknown>;
    getMessageSummary(): Promise<unknown>;
    syncInbox(): Promise<unknown>;
}
