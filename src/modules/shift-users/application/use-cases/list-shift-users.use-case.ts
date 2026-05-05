import { Inject, Injectable } from "@nestjs/common";
import {
  SHIFT_USER_REPOSITORY,
  ShiftUserRepository
} from "../ports/shift-user.repository";
import { QueryShiftUsersQuery } from "../contracts/query-shift-users.query";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
import { ShiftUserResponseMapper } from "../services/shift-user-response.mapper";

@Injectable()
export class ListShiftUsersUseCase {
  constructor(
    @Inject(SHIFT_USER_REPOSITORY)
    private readonly shiftUserRepository: ShiftUserRepository,
    private readonly shiftSchedulePolicyService: ShiftSchedulePolicyService,
    private readonly shiftUserResponseMapper: ShiftUserResponseMapper
  ) {}

  async execute(query: QueryShiftUsersQuery) {
    const users = await this.shiftUserRepository.findManyByShiftDate(
      query.shiftDate ? this.shiftSchedulePolicyService.toDateOnly(query.shiftDate) : undefined
    );

    return users.map((user, index) => this.shiftUserResponseMapper.toResponse(user, index + 1));
  }
}
