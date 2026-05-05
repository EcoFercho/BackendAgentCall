import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListLlmModelsDto } from "./presentation/http/dto/list-llm-models.dto";
import { SaveLlmConfigDto } from "./presentation/http/dto/save-llm-config.dto";
import { LlmConfigService } from "./llm-config.service";

@ApiTags("LLM Config")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtAuthGuard)
@Controller("llm")
export class LlmConfigController {
  constructor(private readonly llmConfigService: LlmConfigService) {}

  @ApiOperation({ summary: "Obtener la configuracion LLM guardada" })
  @Get("config")
  getConfig() {
    return this.llmConfigService.getConfig();
  }

  @ApiOperation({ summary: "Guardar la configuracion LLM y el proveedor activo" })
  @Post("config")
  saveConfig(@Body() body: SaveLlmConfigDto) {
    return this.llmConfigService.saveConfig(body);
  }

  @ApiOperation({ summary: "Listar modelos disponibles para el proveedor API remoto" })
  @Post("models")
  listModels(@Body() body: ListLlmModelsDto) {
    return this.llmConfigService.listModels(body);
  }
}
