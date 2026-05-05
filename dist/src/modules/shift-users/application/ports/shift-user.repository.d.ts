export type ShiftUserRecord = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    shiftDate: Date;
    shiftStart: string;
    shiftEnd: string;
    isMaster: boolean;
    createdAt: Date;
};
export type ShiftUserCreateInput = {
    firstName: string;
    lastName: string;
    phone: string;
    shiftDate: Date;
    shiftStart: string;
    shiftEnd: string;
    isMaster: boolean;
};
export declare const SHIFT_USER_REPOSITORY: unique symbol;
export interface ShiftUserRepository {
    findManyByShiftDate(shiftDate?: Date, excludeId?: string): Promise<ShiftUserRecord[]>;
    findAllOrdered(): Promise<ShiftUserRecord[]>;
    findById(id: string): Promise<ShiftUserRecord | null>;
    create(data: ShiftUserCreateInput): Promise<ShiftUserRecord>;
    update(id: string, data: ShiftUserCreateInput): Promise<ShiftUserRecord>;
    remove(id: string): Promise<void>;
}
