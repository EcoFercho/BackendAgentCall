import { Injectable } from "@nestjs/common";
import { LoginAdminUseCase } from "../application/use-cases/login-admin.use-case";
import { ValidateAdminUserUseCase } from "../application/use-cases/validate-admin-user.use-case";

@Injectable()
export class AuthService {
  constructor(
    private readonly loginAdminUseCase: LoginAdminUseCase,
    private readonly validateAdminUserUseCase: ValidateAdminUserUseCase
  ) {}

  async login(email: string, password: string) {
    return this.loginAdminUseCase.execute(email, password);
  }

  async validateUser(userId: string) {
    return this.validateAdminUserUseCase.execute(userId);
  }
}
