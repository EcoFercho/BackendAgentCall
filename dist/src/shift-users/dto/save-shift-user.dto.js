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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveShiftUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SaveShiftUserDto {
}
exports.SaveShiftUserDto = SaveShiftUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Juan" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Perez" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "70012345" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27", description: "Formato YYYY-MM-DD" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "shiftDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "08:00", description: "Formato HH:mm" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{2}:\d{2}$/),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "shiftStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "17:00", description: "Formato HH:mm" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{2}:\d{2}$/),
    __metadata("design:type", String)
], SaveShiftUserDto.prototype, "shiftEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveShiftUserDto.prototype, "isMaster", void 0);
//# sourceMappingURL=save-shift-user.dto.js.map