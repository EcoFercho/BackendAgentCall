import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepository
} from "../ports/admin-user.repository";
import { TOKEN_SIGNER, TokenSigner } from "../ports/token-signer";

@Injectable()
export class LoginAdminUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: AdminUserRepository,
    @Inject(TOKEN_SIGNER)
    private readonly tokenSigner: TokenSigner
  ) {}

  async execute(email: string, password: string) {
    const user = await this.adminUserRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    return {
      accessToken: await this.tokenSigner.sign({
        sub: user.id,
        email: user.email,
        role: user.role
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
}
