"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginAdminUseCase = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const admin_user_repository_1 = require("../ports/admin-user.repository");
const token_signer_1 = require("../ports/token-signer");
let LoginAdminUseCase = class LoginAdminUseCase {
    constructor(adminUserRepository, tokenSigner) {
        this.adminUserRepository = adminUserRepository;
        this.tokenSigner = tokenSigner;
    }
    async execute(email, password) {
        const user = await this.adminUserRepository.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException("Credenciales invalidas");
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException("Credenciales invalidas");
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
};
exports.LoginAdminUseCase = LoginAdminUseCase;
exports.LoginAdminUseCase = LoginAdminUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(admin_user_repository_1.ADMIN_USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(token_signer_1.TOKEN_SIGNER)),
    __metadata("design:paramtypes", [Object, Object])
], LoginAdminUseCase);
//# sourceMappingURL=login-admin.use-case.js.map