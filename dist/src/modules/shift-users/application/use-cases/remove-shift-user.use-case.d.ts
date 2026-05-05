import { ShiftUserRepository } from "../ports/shift-user.repository";
import { ShiftSchedulePolicyService } from "../../domain/services/shift-schedule-policy.service";
export declare class RemoveShiftUserUseCase {
    private readonly shiftUserRepository;
    private readonly shiftSchedulePolicyService;
    constructor(shiftUserRepository: ShiftUserRepository, shiftSchedulePolicyService: ShiftSchedulePolicyService);
    execute(id: string): Promise<{
        ok: boolean;
    }>;
}
