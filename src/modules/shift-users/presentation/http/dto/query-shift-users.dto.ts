import { IsOptional, IsString, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QueryShiftUsersDto {
  @ApiPropertyOptional({ example: "2026-04-27", description: "Filtra por fecha YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  shiftDate?: string;
}
