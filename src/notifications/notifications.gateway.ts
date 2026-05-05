import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { EmailMessage } from "@prisma/client";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  broadcastTicker(message: EmailMessage) {
    this.server.emit("ticker.email-approved", {
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
      incidentSummaryModel: message.incidentSummaryModel,
      incidentSummaryGeneratedAt: message.incidentSummaryGeneratedAt
    });
  }
}
