"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const prisma_module_1 = require("../../prisma/prisma.module");
const admin_user_repository_1 = require("./application/ports/admin-user.repository");
const token_signer_1 = require("./application/ports/token-signer");
const login_admin_use_case_1 = require("./application/use-cases/login-admin.use-case");
const validate_admin_user_use_case_1 = require("./application/use-cases/validate-admin-user.use-case");
const prisma_admin_user_repository_1 = require("./infrastructure/repositories/prisma-admin-user.repository");
const jwt_token_signer_service_1 = require("./infrastructure/services/jwt-token-signer.service");
const jwt_strategy_1 = require("./infrastructure/strategies/jwt.strategy");
const auth_controller_1 = require("./presentation/http/auth.controller");
const auth_service_1 = require("./services/auth.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            passport_1.PassportModule,
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get("JWT_SECRET", "change-me-now"),
                    signOptions: { expiresIn: "12h" }
                })
            })
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            login_admin_use_case_1.LoginAdminUseCase,
            validate_admin_user_use_case_1.ValidateAdminUserUseCase,
            prisma_admin_user_repository_1.PrismaAdminUserRepository,
            jwt_token_signer_service_1.JwtTokenSignerService,
            {
                provide: admin_user_repository_1.ADMIN_USER_REPOSITORY,
                useExisting: prisma_admin_user_repository_1.PrismaAdminUserRepository
            },
            {
                provide: token_signer_1.TOKEN_SIGNER,
                useExisting: jwt_token_signer_service_1.JwtTokenSignerService
            }
        ],
        exports: [auth_service_1.AuthService]
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map