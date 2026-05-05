import { SaveShiftUserCommand } from "../../application/contracts/save-shift-user.command";
import { ShiftUserRecord } from "../../application/ports/shift-user.repository";
export declare class ShiftSchedulePolicyService {
    validateDateAndTime(command: SaveShiftUserCommand): void;
    ensureNoOverlap(command: SaveShiftUserCommand, users: ShiftUserRecord[]): void;
    ensureExists(user: ShiftUserRecord | null): ShiftUserRecord;
    toDateOnly(value: string): Date;
    toMinutes(time: string): number;
    private getBoliviaDateValue;
    private overlaps;
}
