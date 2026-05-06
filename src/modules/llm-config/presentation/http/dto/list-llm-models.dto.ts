import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LlmProviderType } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { REMOTE_LLM_PROVIDERS } from "./save-llm-config.dto";

export class ListLlmModelsDto {
  @ApiProperty({ enum: LlmProviderType, example: LlmProviderType.API })
  @IsString()
  @IsIn([LlmProviderType.LOCAL, LlmProviderType.API])
  providerType!: LlmProviderType;

  @ApiPropertyOptional({ enum: REMOTE_LLM_PROVIDERS, example: "OPENAI" })
  @IsOptional()
  @IsString()
  @IsIn(REMOTE_LLM_PROVIDERS)
  providerName?: string;

  @ApiPropertyOptional({ example: "sk-..." })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: "http://127.0.0.1:11434" })
  @IsOptional()
  @IsString()
  localBaseUrl?: string;
}
