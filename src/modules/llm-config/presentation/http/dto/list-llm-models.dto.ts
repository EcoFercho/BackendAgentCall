import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { REMOTE_LLM_PROVIDERS } from "./save-llm-config.dto";

export class ListLlmModelsDto {
  @ApiProperty({ enum: REMOTE_LLM_PROVIDERS, example: "OPENAI" })
  @IsString()
  @IsIn(REMOTE_LLM_PROVIDERS)
  providerName!: string;

  @ApiPropertyOptional({ example: "sk-..." })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
