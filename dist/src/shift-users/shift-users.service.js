"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftUsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ShiftUsersService = class ShiftUsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        const users = await this.prisma.shiftUser.findMany({
            where: query.shiftDate
                ? {
                    shiftDate: this.toDateOnly(query.shiftDate)
                }
                : undefined,
            orderBy: [{ shiftDate: "asc" }, { shiftStart: "asc" }, { createdAt: "asc" }]
        });
        return users.map((user, index) => this.toResponse(user, index + 1));
    }
    async create(dto) {
        this.validateDateAndTime(dto);
        await this.ensureNoOverlap(dto);
        const created = await this.prisma.shiftUser.create({
            data: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                phone: dto.phone.trim(),
                shiftDate: this.toDateOnly(dto.shiftDate),
                shiftStart: dto.shiftStart,
                shiftEnd: dto.shiftEnd,
                isMaster: dto.isMaster
            }
        });
        return this.toResponse(created, await this.resolvePriority(created.id));
    }
    async update(id, dto) {
        this.validateDateAndTime(dto);
        await this.ensureExists(id);
        await this.ensureNoOverlap(dto, id);
        const updated = await this.prisma.shiftUser.update({
            where: { id },
            data: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                phone: dto.phone.trim(),
                shiftDate: this.toDateOnly(dto.shiftDate),
                shiftStart: dto.shiftStart,
                shiftEnd: dto.shiftEnd,
                isMaster: dto.isMaster
            }
        });
        return this.toResponse(updated, await this.resolvePriority(updated.id));
    }
    async remove(id) {
        await this.ensureExists(id);
        await this.prisma.shiftUser.delete({ where: { id } });
        return { ok: true };
    }
    async ensureExists(id) {
        const existing = await this.prisma.shiftUser.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException("Turno no encontrado");
        }
        return existing;
    }
    validateDateAndTime(dto) {
        const today = this.startOfDay(new Date());
        const shiftDate = this.toDateOnly(dto.shiftDate);
        if (shiftDate < today) {
            throw new common_1.BadRequestException("No se pueden registrar turnos para fechas pasadas");
        }
        if (this.toMinutes(dto.shiftStart) >= this.toMinutes(dto.shiftEnd)) {
            throw new common_1.BadRequestException("La hora de fin debe ser mayor a la hora de inicio");
        }
    }
    async ensureNoOverlap(dto, excludeId) {
        const sameDateSchedules = await this.prisma.shiftUser.findMany({
            where: {
                shiftDate: this.toDateOnly(dto.shiftDate),
                ...(excludeId ? { id: { not: excludeId } } : {})
            },
            orderBy: { shiftStart: "asc" }
        });
        const conflicting = sameDateSchedules.find((user) => this.overlaps(dto.shiftStart, dto.shiftEnd, user.shiftStart, user.shiftEnd));
        if (conflicting) {
            throw new common_1.BadRequestException(`El horario se solapa con ${conflicting.firstName} ${conflicting.lastName}`);
        }
    }
    async resolvePriority(id) {
        const ordered = await this.prisma.shiftUser.findMany({
            orderBy: [{ shiftDate: "asc" }, { shiftStart: "asc" }, { createdAt: "asc" }],
            select: { id: true }
        });
        return ordered.findIndex((user) => user.id === id) + 1;
    }
    toResponse(user, priority) {
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
    toDateOnly(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }
    startOfDay(value) {
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    toMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }
    overlaps(startA, endA, startB, endB) {
        const startAMinutes = this.toMinutes(startA);
        const endAMinutes = this.toMinutes(endA);
        const startBMinutes = this.toMinutes(startB);
        const endBMinutes = this.toMinutes(endB);
        return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
    }
};
exports.ShiftUsersService = ShiftUsersService;
exports.ShiftUsersService = ShiftUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftUsersService);
//# sourceMappingURL=shift-users.service.js.map