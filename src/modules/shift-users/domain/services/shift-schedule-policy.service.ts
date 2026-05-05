import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SaveShiftUserCommand } from "../../application/contracts/save-shift-user.command";
import { ShiftUserRecord } from "../../application/ports/shift-user.repository";

@Injectable()
export class ShiftSchedulePolicyService {
  validateDateAndTime(command: SaveShiftUserCommand) {
    const today = this.getBoliviaDateValue();

    if (command.shiftDate < today) {
      throw new BadRequestException("No se pueden registrar turnos para fechas pasadas");
    }

    if (this.toMinutes(command.shiftStart) >= this.toMinutes(command.shiftEnd)) {
      throw new BadRequestException("La hora de fin debe ser mayor a la hora de inicio");
    }
  }

  ensureNoOverlap(command: SaveShiftUserCommand, users: ShiftUserRecord[]) {
    const conflicting = users.find((user) =>
      this.overlaps(command.shiftStart, command.shiftEnd, user.shiftStart, user.shiftEnd)
    );

    if (conflicting) {
      throw new BadRequestException(
        `El horario se solapa con ${conflicting.firstName} ${conflicting.lastName}`
      );
    }
  }

  ensureExists(user: ShiftUserRecord | null) {
    if (!user) {
      throw new NotFoundException("Turno no encontrado");
    }

    return user;
  }

  toDateOnly(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  toMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private getBoliviaDateValue(now = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/La_Paz",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    return formatter.format(now);
  }

  private overlaps(startA: string, endA: string, startB: string, endB: string) {
    const startAMinutes = this.toMinutes(startA);
    const endAMinutes = this.toMinutes(endA);
    const startBMinutes = this.toMinutes(startB);
    const endBMinutes = this.toMinutes(endB);

    return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
  }
}
