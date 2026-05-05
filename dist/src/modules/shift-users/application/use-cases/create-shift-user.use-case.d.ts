import { ShiftUserRepository } from "../ports/shift-user.repository";
import { SaveShiftUserCommand } from "../contracts/save-shift-user.command";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
import { ShiftUserResponseMapper } from "../services/shift-user-response.mapper";
export declare class CreateShiftUserUseCase {
    private readonly shiftUserRepository;
    private readonly shiftSchedulePolicyService;
    private readonly shiftUserResponseMapper;
    constructor(shiftUserRepository: ShiftUserRepository, shiftSchedulePolicyService: ShiftSchedulePolicyService, shiftUserResponseMapper: ShiftUserResponseMapper);
    execute(command: SaveShiftUserCommand): Promise<{
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
}
