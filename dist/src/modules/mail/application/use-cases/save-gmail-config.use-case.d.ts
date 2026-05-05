import { SaveGmailConfigCommand } from "../contracts/save-gmail-config.command";
import { MailInboxPort } from "../ports/mail-inbox.port";
export declare class SaveGmailConfigUseCase {
    private readonly mailInboxPort;
    constructor(mailInboxPort: MailInboxPort);
    execute(command: SaveGmailConfigCommand): Promise<unknown>;
}
