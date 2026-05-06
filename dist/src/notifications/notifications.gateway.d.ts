import { EmailMessage } from "@prisma/client";
import { Server } from "socket.io";
type MessageSummaryPayload = {
    classifiedCount: number;
    approvedCount: number;
    lastSyncedAt: string;
};
export declare class NotificationsGateway {
    server: Server;
    broadcastClassifiedMessage(message: EmailMessage): void;
    broadcastMessageSummary(summary: MessageSummaryPayload): void;
}
export {};
