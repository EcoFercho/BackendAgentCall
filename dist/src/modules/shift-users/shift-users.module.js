"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftUsersModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const shift_user_repository_1 = require("./application/ports/shift-user.repository");
const shift_user_response_mapper_1 = require("./application/services/shift-user-response.mapper");
const create_shift_user_use_case_1 = require("./application/use-cases/create-shift-user.use-case");
const list_shift_users_use_case_1 = require("./application/use-cases/list-shift-users.use-case");
const remove_shift_user_use_case_1 = require("./application/use-cases/remove-shift-user.use-case");
const update_shift_user_use_case_1 = require("./application/use-cases/update-shift-user.use-case");
const shift_schedule_policy_service_1 = require("./domain/services/shift-schedule-policy.service");
const prisma_shift_user_repository_1 = require("./infrastructure/repositories/prisma-shift-user.repository");
const shift_users_controller_1 = require("./presentation/http/shift-users.controller");
let ShiftUsersModule = class ShiftUsersModule {
};
exports.ShiftUsersModule = ShiftUsersModule;
exports.ShiftUsersModule = ShiftUsersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [shift_users_controller_1.ShiftUsersController],
        providers: [
            shift_schedule_policy_service_1.ShiftSchedulePolicyService,
            shift_user_response_mapper_1.ShiftUserResponseMapper,
            prisma_shift_user_repository_1.PrismaShiftUserRepository,
            list_shift_users_use_case_1.ListShiftUsersUseCase,
            create_shift_user_use_case_1.CreateShiftUserUseCase,
            update_shift_user_use_case_1.UpdateShiftUserUseCase,
            remove_shift_user_use_case_1.RemoveShiftUserUseCase,
            {
                provide: shift_user_repository_1.SHIFT_USER_REPOSITORY,
                useExisting: prisma_shift_user_repository_1.PrismaShiftUserRepository
            }
        ]
    })
], ShiftUsersModule);
//# sourceMappingURL=shift-users.module.js.map