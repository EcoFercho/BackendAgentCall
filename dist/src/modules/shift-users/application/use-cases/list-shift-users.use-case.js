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
exports.ListShiftUsersUseCase = void 0;
const common_1 = require("@nestjs/common");
const shift_user_repository_1 = require("../ports/shift-user.repository");
const shift_schedule_policy_service_1 = require("../../domain/services/shift-schedule-policy.service");
const shift_user_response_mapper_1 = require("../services/shift-user-response.mapper");
let ListShiftUsersUseCase = class ListShiftUsersUseCase {
    constructor(shiftUserRepository, shiftSchedulePolicyService, shiftUserResponseMapper) {
        this.shiftUserRepository = shiftUserRepository;
        this.shiftSchedulePolicyService = shiftSchedulePolicyService;
        this.shiftUserResponseMapper = shiftUserResponseMapper;
    }
    async execute(query) {
        const users = await this.shiftUserRepository.findManyByShiftDate(query.shiftDate ? this.shiftSchedulePolicyService.toDateOnly(query.shiftDate) : undefined);
        return users.map((user, index) => this.shiftUserResponseMapper.toResponse(user, index + 1));
    }
};
exports.ListShiftUsersUseCase = ListShiftUsersUseCase;
exports.ListShiftUsersUseCase = ListShiftUsersUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(shift_user_repository_1.SHIFT_USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, shift_schedule_policy_service_1.ShiftSchedulePolicyService,
        shift_user_response_mapper_1.ShiftUserResponseMapper])
], ListShiftUsersUseCase);
//# sourceMappingURL=list-shift-users.use-case.js.map