import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../../common/guards/jwt-auth.guard";
import { CreateShiftUserUseCase } from "../../application/use-cases/create-shift-user.use-case";
import { ListShiftUsersUseCase } from "../../application/use-cases/list-shift-users.use-case";
import { RemoveShiftUserUseCase } from "../../application/use-cases/remove-shift-user.use-case";
import { UpdateShiftUserUseCase } from "../../application/use-cases/update-shift-user.use-case";
import { QueryShiftUsersDto } from "./dto/query-shift-users.dto";
import { SaveShiftUserDto } from "./dto/save-shift-user.dto";

@ApiTags("Shift Users")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtAuthGuard)
@Controller("shift-users")
export class ShiftUsersController {
  constructor(
    private readonly listShiftUsersUseCase: ListShiftUsersUseCase,
    private readonly createShiftUserUseCase: CreateShiftUserUseCase,
    private readonly updateShiftUserUseCase: UpdateShiftUserUseCase,
    private readonly removeShiftUserUseCase: RemoveShiftUserUseCase
  ) {}

  @ApiOperation({ summary: "Listar usuarios programados" })
  @ApiQuery({ name: "shiftDate", required: false, description: "Filtrar por fecha YYYY-MM-DD" })
  @Get()
  list(@Query() query: QueryShiftUsersDto) {
    return this.listShiftUsersUseCase.execute(query);
  }

  @ApiOperation({ summary: "Crear un usuario de turno" })
  @Post()
  create(@Body() body: SaveShiftUserDto) {
    return this.createShiftUserUseCase.execute(body);
  }

  @ApiOperation({ summary: "Actualizar un usuario de turno" })
  @ApiParam({ name: "id", description: "ID del usuario de turno" })
  @Put(":id")
  update(@Param("id") id: string, @Body() body: SaveShiftUserDto) {
    return this.updateShiftUserUseCase.execute(id, body);
  }

  @ApiOperation({ summary: "Eliminar un usuario de turno" })
  @ApiParam({ name: "id", description: "ID del usuario de turno" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.removeShiftUserUseCase.execute(id);
  }
}
