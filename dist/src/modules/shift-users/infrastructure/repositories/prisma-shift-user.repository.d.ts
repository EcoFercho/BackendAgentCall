import { PrismaService } from "../../../../prisma/prisma.service";
import { ShiftUserCreateInput, ShiftUserRepository } from "../../application/ports/shift-user.repository";
export declare class PrismaShiftUserRepository implements ShiftUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findManyByShiftDate(shiftDate?: Date, excludeId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: Date;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }[]>;
    findAllOrdered(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: Date;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: Date;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    } | null>;
    create(data: ShiftUserCreateInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: Date;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }>;
    update(id: string, data: ShiftUserCreateInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: Date;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }>;
    remove(id: string): Promise<void>;
}
