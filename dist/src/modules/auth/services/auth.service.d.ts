import { LoginAdminUseCase } from "../application/use-cases/login-admin.use-case";
import { ValidateAdminUserUseCase } from "../application/use-cases/validate-admin-user.use-case";
export declare class AuthService {
    private readonly loginAdminUseCase;
    private readonly validateAdminUserUseCase;
    constructor(loginAdminUseCase: LoginAdminUseCase, validateAdminUserUseCase: ValidateAdminUserUseCase);
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: "ADMIN";
        };
    }>;
    validateUser(userId: string): Promise<import("../application/ports/admin-user.repository").AdminUserView | null>;
}
