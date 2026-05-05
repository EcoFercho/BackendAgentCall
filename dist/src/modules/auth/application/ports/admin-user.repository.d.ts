export type AdminUserRecord = {
    id: string;
    email: string;
    passwordHash: string;
    role: "ADMIN";
};
export type AdminUserView = {
    id: string;
    email: string;
    role: "ADMIN";
};
export declare const ADMIN_USER_REPOSITORY: unique symbol;
export interface AdminUserRepository {
    findByEmail(email: string): Promise<AdminUserRecord | null>;
    findViewById(id: string): Promise<AdminUserView | null>;
}
