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
exports.ShiftUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const query_shift_users_dto_1 = require("./dto/query-shift-users.dto");
const save_shift_user_dto_1 = require("./dto/save-shift-user.dto");
const shift_users_service_1 = require("./shift-users.service");
let ShiftUsersController = class ShiftUsersController {
    constructor(shiftUsersService) {
        this.shiftUsersService = shiftUsersService;
    }
    list(query) {
        return this.shiftUsersService.list(query);
    }
    create(body) {
        return this.shiftUsersService.create(body);
    }
    update(id, body) {
        return this.shiftUsersService.update(id, body);
    }
    remove(id) {
        return this.shiftUsersService.remove(id);
    }
};
exports.ShiftUsersController = ShiftUsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Listar usuarios programados" }),
    (0, swagger_1.ApiQuery)({ name: "shiftDate", required: false, description: "Filtrar por fecha YYYY-MM-DD" }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_shift_users_dto_1.QueryShiftUsersDto]),
    __metadata("design:returntype", void 0)
], ShiftUsersController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Crear un usuario de turno" }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [save_shift_user_dto_1.SaveShiftUserDto]),
    __metadata("design:returntype", void 0)
], ShiftUsersController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Actualizar un usuario de turno" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "ID del usuario de turno" }),
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, save_shift_user_dto_1.SaveShiftUserDto]),
    __metadata("design:returntype", void 0)
], ShiftUsersController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Eliminar un usuario de turno" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "ID del usuario de turno" }),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftUsersController.prototype, "remove", null);
exports.ShiftUsersController = ShiftUsersController = __decorate([
    (0, swagger_1.ApiTags)("Shift Users"),
    (0, swagger_1.ApiBearerAuth)("bearerAuth"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("shift-users"),
    __metadata("design:paramtypes", [shift_users_service_1.ShiftUsersService])
], ShiftUsersController);
//# sourceMappingURL=shift-users.controller.js.map