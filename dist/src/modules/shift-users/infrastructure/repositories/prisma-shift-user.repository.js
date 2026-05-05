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
exports.PrismaShiftUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
let PrismaShiftUserRepository = class PrismaShiftUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findManyByShiftDate(shiftDate, excludeId) {
        return this.prisma.shiftUser.findMany({
            where: shiftDate
                ? {
                    shiftDate,
                    ...(excludeId ? { id: { not: excludeId } } : {})
                }
                : excludeId
                    ? { id: { not: excludeId } }
                    : undefined,
            orderBy: [{ shiftDate: "asc" }, { shiftStart: "asc" }, { createdAt: "asc" }]
        });
    }
    async findAllOrdered() {
        return this.prisma.shiftUser.findMany({
            orderBy: [{ shiftDate: "asc" }, { shiftStart: "asc" }, { createdAt: "asc" }]
        });
    }
    async findById(id) {
        return this.prisma.shiftUser.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.shiftUser.create({ data });
    }
    async update(id, data) {
        return this.prisma.shiftUser.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        await this.prisma.shiftUser.delete({ where: { id } });
    }
};
exports.PrismaShiftUserRepository = PrismaShiftUserRepository;
exports.PrismaShiftUserRepository = PrismaShiftUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaShiftUserRepository);
//# sourceMappingURL=prisma-shift-user.repository.js.map