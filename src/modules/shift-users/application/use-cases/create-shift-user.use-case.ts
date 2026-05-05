import { Inject, Injectable } from "@nestjs/common";
import {
  SHIFT_USER_REPOSITORY,
  ShiftUserRepository
} from "../ports/shift-user.repository";
import { SaveShiftUserCommand } from "../contracts/save-shift-user.command";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
import { ShiftUserResponseMapper } from "../services/shift-user-response.mapper";

@Injectable()
export class CreateShiftUserUseCase {
  constructor(
    @Inject(SHIFT_USER_REPOSITORY)
    private readonly shiftUserRepository: ShiftUserRepository,
    private readonly shiftSchedulePolicyService: ShiftSchedulePolicyService,
    private readonly shiftUserResponseMapper: ShiftUserResponseMapper
  ) {}

  async execute(command: SaveShiftUserCommand) {
    this.shiftSchedulePolicyService.validateDateAndTime(command);
    const shiftDate = this.shiftSchedulePolicyService.toDateOnly(command.shiftDate);
    const sameDateSchedules = await this.shiftUserRepository.findManyByShiftDate(shiftDate);
    this.shiftSchedulePolicyService.ensureNoOverlap(command, sameDateSchedules);

    const created = await this.shiftUserRepository.create({
      firstName: command.firstName.trim(),
      lastName: command.lastName.trim(),
      phone: command.phone.trim(),
      shiftDate,
      shiftStart: command.shiftStart,
      shiftEnd: command.shiftEnd,
      isMaster: command.isMaster
    });

    const ordered = await this.shiftUserRepository.findAllOrdered();
    const priority = ordered.findIndex((user) => user.id === created.id) + 1;

    return this.shiftUserResponseMapper.toResponse(created, priority);
  }
}
