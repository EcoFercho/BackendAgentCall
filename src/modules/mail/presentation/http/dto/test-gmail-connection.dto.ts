import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TestGmailConnectionDto {
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
}
