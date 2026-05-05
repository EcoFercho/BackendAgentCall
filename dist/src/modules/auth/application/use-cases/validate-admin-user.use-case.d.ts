import { AdminUserRepository } from "../ports/admin-user.repository";
export declare class ValidateAdminUserUseCase {
    private readonly adminUserRepository;
    constructor(adminUserRepository: AdminUserRepository);
    execute(userId: string): Promise<import("../ports/admin-user.repository").AdminUserView | null>;
}
