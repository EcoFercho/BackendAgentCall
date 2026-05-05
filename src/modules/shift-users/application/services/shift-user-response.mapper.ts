import { Injectable } from "@nestjs/common";
import { ShiftUserRecord } from "../ports/shift-user.repository";

@Injectable()
export class ShiftUserResponseMapper {
  toResponse(user: ShiftUserRecord, priority: number) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      shiftDate: user.shiftDate.toISOString().slice(0, 10),
      shiftStart: user.shiftStart,
      shiftEnd: user.shiftEnd,
      isMaster: user.isMaster,
      priority
    };
  }
}
