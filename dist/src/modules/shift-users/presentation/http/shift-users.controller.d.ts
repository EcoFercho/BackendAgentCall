import { CreateShiftUserUseCase } from "../../application/use-cases/create-shift-user.use-case";
import { ListShiftUsersUseCase } from "../../application/use-cases/list-shift-users.use-case";
import { RemoveShiftUserUseCase } from "../../application/use-cases/remove-shift-user.use-case";
import { UpdateShiftUserUseCase } from "../../application/use-cases/update-shift-user.use-case";
import { QueryShiftUsersDto } from "./dto/query-shift-users.dto";
import { SaveShiftUserDto } from "./dto/save-shift-user.dto";
export declare class ShiftUsersController {
    private readonly listShiftUsersUseCase;
    private readonly createShiftUserUseCase;
    private readonly updateShiftUserUseCase;
    private readonly removeShiftUserUseCase;
    constructor(listShiftUsersUseCase: ListShiftUsersUseCase, createShiftUserUseCase: CreateShiftUserUseCase, updateShiftUserUseCase: UpdateShiftUserUseCase, removeShiftUserUseCase: RemoveShiftUserUseCase);
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
