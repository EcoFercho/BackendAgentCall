import { MailInboxPort } from "../ports/mail-inbox.port";
export declare class ListClassifiedMessagesUseCase {
    private readonly mailInboxPort;
    constructor(mailInboxPort: MailInboxPort);
    execute(): Promise<unknown>;
}
