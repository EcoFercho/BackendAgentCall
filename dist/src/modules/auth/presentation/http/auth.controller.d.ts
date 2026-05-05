import { Request } from "express";
import { AuthService } from "../../services/auth.service";
import { LoginDto } from "./dto/login.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: "ADMIN";
        };
    }>;
    me(request: Request): Express.User | undefined;
}
