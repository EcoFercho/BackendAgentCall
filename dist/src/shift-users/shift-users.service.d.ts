import { PrismaService } from "../prisma/prisma.service";
import { QueryShiftUsersDto } from "./dto/query-shift-users.dto";
import { SaveShiftUserDto } from "./dto/save-shift-user.dto";
export declare class ShiftUsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(query: QueryShiftUsersDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: string;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }[]>;
    create(dto: SaveShiftUserDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: string;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }>;
    update(id: string, dto: SaveShiftUserDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: string;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    private ensureExists;
    private validateDateAndTime;
    private ensureNoOverlap;
    private resolvePriority;
    private toResponse;
    private toDateOnly;
    private startOfDay;
    private toMinutes;
    private overlaps;
}
