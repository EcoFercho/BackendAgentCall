import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SaveGmailConfigDto {
  @ApiProperty({ example: "erwin0pisis@gmail.com" })
  @IsEmail()
  baseEmail!: string;

  @ApiPropertyOptional({ example: "abcd efgh ijkl mnop" })
  @IsOptional()
  @IsString()
  appPassword?: string;

  @ApiProperty({ example: "imap.gmail.com" })
  @IsString()
  host!: string;

  @ApiProperty({ example: 993, minimum: 1, maximum: 65535 })
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  secure!: boolean;

  @ApiProperty({ example: 45, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  spamScoreLimit!: number;

  @ApiPropertyOptional({ type: [String], example: ["cliente.com", "monitoring.local"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ type: [String], example: ["alerts@cliente.com"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedSenders?: string[];

  @ApiPropertyOptional({ type: [String], example: ["Union Agronegocios", "XOC"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientKeywords?: string[];

  @ApiPropertyOptional({ type: [String], example: ["incidente", "afectacion", "severidad"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incidentKeywords?: string[];

  @ApiPropertyOptional({ type: [String], example: ["newsletter", "promocion"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedKeywords?: string[];
}
