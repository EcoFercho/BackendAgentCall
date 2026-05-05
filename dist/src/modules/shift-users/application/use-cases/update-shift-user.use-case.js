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
exports.UpdateShiftUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const shift_user_repository_1 = require("../ports/shift-user.repository");
const shift_schedule_policy_service_1 = require("../../domain/services/shift-schedule-policy.service");
const shift_user_response_mapper_1 = require("../services/shift-user-response.mapper");
let UpdateShiftUserUseCase = class UpdateShiftUserUseCase {
    constructor(shiftUserRepository, shiftSchedulePolicyService, shiftUserResponseMapper) {
        this.shiftUserRepository = shiftUserRepository;
        this.shiftSchedulePolicyService = shiftSchedulePolicyService;
        this.shiftUserResponseMapper = shiftUserResponseMapper;
    }
    async execute(id, command) {
        this.shiftSchedulePolicyService.validateDateAndTime(command);
        this.shiftSchedulePolicyService.ensureExists(await this.shiftUserRepository.findById(id));
        const shiftDate = this.shiftSchedulePolicyService.toDateOnly(command.shiftDate);
        const sameDateSchedules = await this.shiftUserRepository.findManyByShiftDate(shiftDate, id);
        this.shiftSchedulePolicyService.ensureNoOverlap(command, sameDateSchedules);
        const updated = await this.shiftUserRepository.update(id, {
            firstName: command.firstName.trim(),
            lastName: command.lastName.trim(),
            phone: command.phone.trim(),
            shiftDate,
            shiftStart: command.shiftStart,
            shiftEnd: command.shiftEnd,
            isMaster: command.isMaster
        });
        const ordered = await this.shiftUserRepository.findAllOrdered();
        const priority = ordered.findIndex((user) => user.id === updated.id) + 1;
        return this.shiftUserResponseMapper.toResponse(updated, priority);
    }
};
exports.UpdateShiftUserUseCase = UpdateShiftUserUseCase;
exports.UpdateShiftUserUseCase = UpdateShiftUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(shift_user_repository_1.SHIFT_USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, shift_schedule_policy_service_1.ShiftSchedulePolicyService,
        shift_user_response_mapper_1.ShiftUserResponseMapper])
], UpdateShiftUserUseCase);
//# sourceMappingURL=update-shift-user.use-case.js.map