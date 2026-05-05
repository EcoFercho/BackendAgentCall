import { Inject, Injectable } from "@nestjs/common";
import {
  SHIFT_USER_REPOSITORY,
  ShiftUserRepository
} from "../ports/shift-user.repository";
import { SaveShiftUserCommand } from "../contracts/save-shift-user.command";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
import { ShiftUserResponseMapper } from "../services/shift-user-response.mapper";

@Injectable()
export class UpdateShiftUserUseCase {
  constructor(
    @Inject(SHIFT_USER_REPOSITORY)
    private readonly shiftUserRepository: ShiftUserRepository,
    private readonly shiftSchedulePolicyService: ShiftSchedulePolicyService,
    private readonly shiftUserResponseMapper: ShiftUserResponseMapper
  ) {}

  async execute(id: string, command: SaveShiftUserCommand) {
    this.shiftSchedulePolicyService.validateDateAndTime(command);
    this.shiftSchedulePolicyService.ensureExists(await this.shiftUserRepository.findById(id));
    const shiftDate = this.shiftSchedulePolicyService.toDateOnly(command.shiftDate);
    const sameDateSchedules = await this.shiftUserRepository.findManyByShiftDate(shiftDate, id);
    this.shiftSchedulePolicyService.ensureNoOverlap(command, sameDateSchedules);

    const updated = await this.shiftUserRepository.update(id, {
      firstName: command.firstName.trim(),
      lastName: command.lastName.trim(),
      phone: command.phone.trim(),
      shiftDate,
      shiftStart: command.shiftStart,
      shiftEnd: command.shiftEnd,
      isMaster: command.isMaster
    });

    const ordered = await this.shiftUserRepository.findAllOrdered();
    const priority = ordered.findIndex((user) => user.id === updated.id) + 1;

    return this.shiftUserResponseMapper.toResponse(updated, priority);
  }
}
