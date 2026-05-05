import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../../prisma/prisma.module";
import {
  ADMIN_USER_REPOSITORY
} from "./application/ports/admin-user.repository";
import { TOKEN_SIGNER } from "./application/ports/token-signer";
import { LoginAdminUseCase } from "./application/use-cases/login-admin.use-case";
import { ValidateAdminUserUseCase } from "./application/use-cases/validate-admin-user.use-case";
import { PrismaAdminUserRepository } from "./infrastructure/repositories/prisma-admin-user.repository";
import { JwtTokenSignerService } from "./infrastructure/services/jwt-token-signer.service";
import { JwtStrategy } from "./infrastructure/strategies/jwt.strategy";
import { AuthController } from "./presentation/http/auth.controller";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET", "change-me-now"),
        signOptions: { expiresIn: "12h" }
      })
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LoginAdminUseCase,
    ValidateAdminUserUseCase,
    PrismaAdminUserRepository,
    JwtTokenSignerService,
    {
      provide: ADMIN_USER_REPOSITORY,
      useExisting: PrismaAdminUserRepository
    },
    {
      provide: TOKEN_SIGNER,
      useExisting: JwtTokenSignerService
    }
  ],
  exports: [AuthService]
})
export class AuthModule {}
