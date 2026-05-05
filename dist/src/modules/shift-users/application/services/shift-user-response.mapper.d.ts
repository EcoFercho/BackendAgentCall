import { ShiftUserRecord } from "../ports/shift-user.repository";
export declare class ShiftUserResponseMapper {
    toResponse(user: ShiftUserRecord, priority: number): {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        shiftDate: string;
        shiftStart: string;
        shiftEnd: string;
        isMaster: boolean;
        priority: number;
    };
}
