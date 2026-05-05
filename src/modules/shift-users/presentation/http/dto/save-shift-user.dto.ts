import { IsBoolean, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SaveShiftUserDto {
  @ApiProperty({ example: "Juan" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: "Perez" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: "70012345" })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone!: string;

  @ApiProperty({ example: "2026-04-27", description: "Formato YYYY-MM-DD" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  shiftDate!: string;

  @ApiProperty({ example: "08:00", description: "Formato HH:mm" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  shiftStart!: string;

  @ApiProperty({ example: "17:00", description: "Formato HH:mm" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  shiftEnd!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isMaster!: boolean;
}
