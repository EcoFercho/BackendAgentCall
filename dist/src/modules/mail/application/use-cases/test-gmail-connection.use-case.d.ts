import { TestGmailConnectionCommand } from "../contracts/test-gmail-connection.command";
import { MailInboxPort } from "../ports/mail-inbox.port";
export declare class TestGmailConnectionUseCase {
    private readonly mailInboxPort;
    constructor(mailInboxPort: MailInboxPort);
    execute(command: TestGmailConnectionCommand): Promise<unknown>;
}
