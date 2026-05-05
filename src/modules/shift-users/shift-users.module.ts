import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SHIFT_USER_REPOSITORY } from "./application/ports/shift-user.repository";
import { ShiftUserResponseMapper } from "./application/services/shift-user-response.mapper";
import { CreateShiftUserUseCase } from "./application/use-cases/create-shift-user.use-case";
import { ListShiftUsersUseCase } from "./application/use-cases/list-shift-users.use-case";
import { RemoveShiftUserUseCase } from "./application/use-cases/remove-shift-user.use-case";
import { UpdateShiftUserUseCase } from "./application/use-cases/update-shift-user.use-case";
import { ShiftSchedulePolicyService } from "./domain/services/shift-schedule-policy.service";
import { PrismaShiftUserRepository } from "./infrastructure/repositories/prisma-shift-user.repository";
import { ShiftUsersController } from "./presentation/http/shift-users.controller";

@Module({
  imports: [PrismaModule],
  controllers: [ShiftUsersController],
  providers: [
    ShiftSchedulePolicyService,
    ShiftUserResponseMapper,
    PrismaShiftUserRepository,
    ListShiftUsersUseCase,
    CreateShiftUserUseCase,
    UpdateShiftUserUseCase,
    RemoveShiftUserUseCase,
    {
      provide: SHIFT_USER_REPOSITORY,
      useExisting: PrismaShiftUserRepository
    }
  ]
})
export class ShiftUsersModule {}
