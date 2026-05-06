import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { EmailMessage } from "@prisma/client";
import { Server } from "socket.io";

type MessageSummaryPayload = {
  classifiedCount: number;
  approvedCount: number;
  lastSyncedAt: string;
};

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  broadcastClassifiedMessage(message: EmailMessage) {
    this.server.emit("ticker.email-classified", {
      id: message.id,
      fromName: message.fromName,
      fromEmail: message.fromEmail,
      subject: message.subject,
      snippet: message.snippet,
      bodyText: message.bodyText,
      receivedAt: message.receivedAt,
      status: message.status,
      classificationReason: message.classificationReason,
      classificationConfidence: message.classificationConfidence,
      matchedRules: message.matchedRules,
      detectedClientName: message.detectedClientName,
      incidentSummary: message.incidentSummary,
      incidentCategory: message.incidentCategory,
      incidentStatus: message.incidentStatus,
      incidentSeverity: message.incidentSeverity,
      incidentSummaryModel: message.incidentSummaryModel,
      incidentSummaryGeneratedAt: message.incidentSummaryGeneratedAt
    });
  }

  broadcastMessageSummary(summary: MessageSummaryPayload) {
    this.server.emit("ticker.summary", summary);
  }
}
