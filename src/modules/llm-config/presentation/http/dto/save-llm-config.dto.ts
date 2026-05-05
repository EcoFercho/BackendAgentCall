import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LlmProviderType } from "@prisma/client";
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const REMOTE_LLM_PROVIDERS = ["OPENAI", "ANTHROPIC", "GOOGLE"] as const;
export type RemoteLlmProvider = (typeof REMOTE_LLM_PROVIDERS)[number];

export class SaveLlmConfigDto {
  @ApiProperty({ enum: LlmProviderType, example: LlmProviderType.LOCAL })
  @IsEnum(LlmProviderType)
  activeProvider!: LlmProviderType;

  @ApiProperty({ example: "http://127.0.0.1:11434" })
  @IsString()
  localBaseUrl!: string;

  @ApiProperty({ example: "/api/generate" })
  @IsString()
  localGeneratePath!: string;

  @ApiProperty({ example: "gemma4:26b" })
  @IsString()
  localModel!: string;

  @ApiProperty({ example: 30000, minimum: 1000, maximum: 120000 })
  @IsInt()
  @Min(1000)
  @Max(120000)
  localTimeoutMs!: number;

  @ApiPropertyOptional({ enum: REMOTE_LLM_PROVIDERS, example: "OPENAI" })
  @IsOptional()
  @IsString()
  @IsIn(REMOTE_LLM_PROVIDERS)
  apiProviderName?: string;

  @ApiPropertyOptional({ example: "https://api.openai.com" })
  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @ApiPropertyOptional({ example: "/v1/responses" })
  @IsOptional()
  @IsString()
  apiGeneratePath?: string;

  @ApiPropertyOptional({ example: "gpt-4.1-mini" })
  @IsOptional()
  @IsString()
  apiModel?: string;

  @ApiPropertyOptional({ example: "## Referencia operativa\nInstrucciones base para el modelo" })
  @IsOptional()
  @IsString()
  referenceMarkdown?: string;

  @ApiPropertyOptional({ example: "sk-..." })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({ example: 30000, minimum: 1000, maximum: 120000 })
  @IsInt()
  @Min(1000)
  @Max(120000)
  apiTimeoutMs!: number;
}
