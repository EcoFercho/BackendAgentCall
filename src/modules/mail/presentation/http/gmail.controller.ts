import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../../common/guards/jwt-auth.guard";
import { GetGmailConfigUseCase } from "../../application/use-cases/get-gmail-config.use-case";
import { GenerateIncidentSummaryUseCase } from "../../application/use-cases/generate-incident-summary.use-case";
import { GetMessageSummaryUseCase } from "../../application/use-cases/get-message-summary.use-case";
import { ListApprovedMessagesUseCase } from "../../application/use-cases/list-approved-messages.use-case";
import { ListClassifiedMessagesUseCase } from "../../application/use-cases/list-classified-messages.use-case";
import { SaveGmailConfigUseCase } from "../../application/use-cases/save-gmail-config.use-case";
import { SyncGmailInboxUseCase } from "../../application/use-cases/sync-gmail-inbox.use-case";
import { TestGmailConnectionUseCase } from "../../application/use-cases/test-gmail-connection.use-case";
import { SaveGmailConfigDto } from "./dto/save-gmail-config.dto";
import { TestGmailConnectionDto } from "./dto/test-gmail-connection.dto";

@ApiTags("Gmail")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtAuthGuard)
@Controller("gmail")
export class GmailController {
  constructor(
    private readonly getGmailConfigUseCase: GetGmailConfigUseCase,
    private readonly getMessageSummaryUseCase: GetMessageSummaryUseCase,
    private readonly generateIncidentSummaryUseCase: GenerateIncidentSummaryUseCase,
    private readonly saveGmailConfigUseCase: SaveGmailConfigUseCase,
    private readonly testGmailConnectionUseCase: TestGmailConnectionUseCase,
    private readonly listApprovedMessagesUseCase: ListApprovedMessagesUseCase,
    private readonly listClassifiedMessagesUseCase: ListClassifiedMessagesUseCase,
    private readonly syncGmailInboxUseCase: SyncGmailInboxUseCase
  ) {}

  @ApiOperation({ summary: "Obtener la configuracion de Gmail guardada" })
  @Get("config")
  getConfig() {
    return this.getGmailConfigUseCase.execute();
  }

  @ApiOperation({ summary: "Guardar la configuracion de Gmail" })
  @Post("config")
  saveConfig(@Body() body: SaveGmailConfigDto) {
    return this.saveGmailConfigUseCase.execute(body);
  }

  @ApiOperation({ summary: "Probar la conexion a Gmail con los datos enviados" })
  @Post("config/test")
  testConnection(@Body() body: TestGmailConnectionDto) {
    return this.testGmailConnectionUseCase.execute(body);
  }

  @ApiOperation({ summary: "Listar mensajes aprobados" })
  @Get("messages")
  getApprovedMessages() {
    return this.listApprovedMessagesUseCase.execute();
  }

  @ApiOperation({ summary: "Listar mensajes clasificados con motivo y confianza" })
  @Get("messages/classified")
  getClassifiedMessages() {
    return this.listClassifiedMessagesUseCase.execute();
  }

  @ApiOperation({ summary: "Obtener resumen de conteo de mensajes clasificados" })
  @Get("messages/summary")
  getMessageSummary() {
    return this.getMessageSummaryUseCase.execute();
  }

  @ApiOperation({ summary: "Generar y guardar el incidente para un correo relevante" })
  @Post("messages/:id/incident")
  generateIncidentSummary(@Param("id") id: string) {
    return this.generateIncidentSummaryUseCase.execute(id);
  }

  @ApiOperation({ summary: "Sincronizar la bandeja y procesar mensajes" })
  @Post("sync")
  syncInbox() {
    return this.syncGmailInboxUseCase.execute();
  }
}
