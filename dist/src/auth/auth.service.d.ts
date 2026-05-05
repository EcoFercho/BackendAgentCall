import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: "ADMIN";
        };
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        role: "ADMIN";
    } | null>;
}
