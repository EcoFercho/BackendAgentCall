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

export const ADMIN_USER_REPOSITORY = Symbol("ADMIN_USER_REPOSITORY");

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  findViewById(id: string): Promise<AdminUserView | null>;
}
