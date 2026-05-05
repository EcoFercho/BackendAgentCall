import { MailInboxPort } from "../ports/mail-inbox.port";
export declare class GetGmailConfigUseCase {
    private readonly mailInboxPort;
    constructor(mailInboxPort: MailInboxPort);
    execute(): Promise<unknown>;
}
