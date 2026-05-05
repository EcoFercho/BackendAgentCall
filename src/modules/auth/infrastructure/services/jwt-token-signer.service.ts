import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  AuthTokenPayload,
  TokenSigner
} from "../../application/ports/token-signer";

@Injectable()
export class JwtTokenSignerService implements TokenSigner {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: AuthTokenPayload) {
    return this.jwtService.signAsync(payload);
  }
}
