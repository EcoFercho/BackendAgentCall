import { EmailMessage } from "@prisma/client";
import { Server } from "socket.io";
export declare class NotificationsGateway {
    server: Server;
    broadcastTicker(message: EmailMessage): void;
}
