import { Request } from "express";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";
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
