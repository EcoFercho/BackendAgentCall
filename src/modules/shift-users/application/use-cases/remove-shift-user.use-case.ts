import { Inject, Injectable } from "@nestjs/common";
import {
  SHIFT_USER_REPOSITORY,
  ShiftUserRepository
} from "../ports/shift-user.repository";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";

@Injectable()
export class RemoveShiftUserUseCase {
  constructor(
    @Inject(SHIFT_USER_REPOSITORY)
    private readonly shiftUserRepository: ShiftUserRepository,
    private readonly shiftSchedulePolicyService: ShiftSchedulePolicyService
  ) {}

  async execute(id: string) {
    this.shiftSchedulePolicyService.ensureExists(await this.shiftUserRepository.findById(id));
    await this.shiftUserRepository.remove(id);
    return { ok: true };
  }
}
