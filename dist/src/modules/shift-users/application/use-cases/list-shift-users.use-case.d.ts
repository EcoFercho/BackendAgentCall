import { ShiftUserRepository } from "../ports/shift-user.repository";
import { QueryShiftUsersQuery } from "../contracts/query-shift-users.query";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
import { ShiftUserResponseMapper } from "../services/shift-user-response.mapper";
export declare class ListShiftUsersUseCase {
    private readonly shiftUserRepository;
    private readonly shiftSchedulePolicyService;
    private readonly shiftUserResponseMapper;
    constructor(shiftUserRepository: ShiftUserRepository, shiftSchedulePolicyService: ShiftSchedulePolicyService, shiftUserResponseMapper: ShiftUserResponseMapper);
    execute(query: QueryShiftUsersQuery): Promise<{
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
}
