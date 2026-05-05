import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import {
  ShiftUserCreateInput,
  ShiftUserRepository
} from "../../application/ports/shift-user.repository";

@Injectable()
export class PrismaShiftUserRepository implements ShiftUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByShiftDate(shiftDate?: Date, excludeId?: string) {
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

  async findById(id: string) {
    return this.prisma.shiftUser.findUnique({ where: { id } });
  }

  async create(data: ShiftUserCreateInput) {
    return this.prisma.shiftUser.create({ data });
  }

  async update(id: string, data: ShiftUserCreateInput) {
    return this.prisma.shiftUser.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.prisma.shiftUser.delete({ where: { id } });
  }
}
