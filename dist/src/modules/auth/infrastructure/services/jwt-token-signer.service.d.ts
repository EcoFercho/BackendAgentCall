import { JwtService } from "@nestjs/jwt";
import { AuthTokenPayload, TokenSigner } from "../../application/ports/token-signer";
export declare class JwtTokenSignerService implements TokenSigner {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    sign(payload: AuthTokenPayload): Promise<string>;
}
