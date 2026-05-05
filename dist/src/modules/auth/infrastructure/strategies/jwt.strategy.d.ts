import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import { AuthService } from "../../services/auth.service";
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: {
        sub: string;
    }): Promise<import("../../application/ports/admin-user.repository").AdminUserView | null>;
}
export {};
