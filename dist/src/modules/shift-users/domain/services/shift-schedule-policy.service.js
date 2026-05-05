"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftSchedulePolicyService = void 0;
const common_1 = require("@nestjs/common");
let ShiftSchedulePolicyService = class ShiftSchedulePolicyService {
    validateDateAndTime(command) {
        const today = this.getBoliviaDateValue();
        if (command.shiftDate < today) {
            throw new common_1.BadRequestException("No se pueden registrar turnos para fechas pasadas");
        }
        if (this.toMinutes(command.shiftStart) >= this.toMinutes(command.shiftEnd)) {
            throw new common_1.BadRequestException("La hora de fin debe ser mayor a la hora de inicio");
        }
    }
    ensureNoOverlap(command, users) {
        const conflicting = users.find((user) => this.overlaps(command.shiftStart, command.shiftEnd, user.shiftStart, user.shiftEnd));
        if (conflicting) {
            throw new common_1.BadRequestException(`El horario se solapa con ${conflicting.firstName} ${conflicting.lastName}`);
        }
    }
    ensureExists(user) {
        if (!user) {
            throw new common_1.NotFoundException("Turno no encontrado");
        }
        return user;
    }
    toDateOnly(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }
    toMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }
    getBoliviaDateValue(now = new Date()) {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/La_Paz",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
        return formatter.format(now);
    }
    overlaps(startA, endA, startB, endB) {
        const startAMinutes = this.toMinutes(startA);
        const endAMinutes = this.toMinutes(endA);
        const startBMinutes = this.toMinutes(startB);
        const endBMinutes = this.toMinutes(endB);
        return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
    }
};
exports.ShiftSchedulePolicyService = ShiftSchedulePolicyService;
exports.ShiftSchedulePolicyService = ShiftSchedulePolicyService = __decorate([
    (0, common_1.Injectable)()
], ShiftSchedulePolicyService);
//# sourceMappingURL=shift-schedule-policy.service.js.map