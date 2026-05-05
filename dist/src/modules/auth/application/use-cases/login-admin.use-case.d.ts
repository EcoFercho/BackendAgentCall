import { AdminUserRepository } from "../ports/admin-user.repository";
import { TokenSigner } from "../ports/token-signer";
export declare class LoginAdminUseCase {
    private readonly adminUserRepository;
    private readonly tokenSigner;
    constructor(adminUserRepository: AdminUserRepository, tokenSigner: TokenSigner);
    execute(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: "ADMIN";
        };
    }>;
}
