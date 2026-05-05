import { QueryShiftUsersDto } from "./dto/query-shift-users.dto";
import { SaveShiftUserDto } from "./dto/save-shift-user.dto";
import { ShiftUsersService } from "./shift-users.service";
export declare class ShiftUsersController {
    private readonly shiftUsersService;
    constructor(shiftUsersService: ShiftUsersService);
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
    create(body: SaveShiftUserDto): Promise<{
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
    update(id: string, body: SaveShiftUserDto): Promise<{
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
}
