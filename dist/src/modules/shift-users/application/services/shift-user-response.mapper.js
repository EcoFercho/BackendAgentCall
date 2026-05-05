"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftUserResponseMapper = void 0;
const common_1 = require("@nestjs/common");
let ShiftUserResponseMapper = class ShiftUserResponseMapper {
    toResponse(user, priority) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            shiftDate: user.shiftDate.toISOString().slice(0, 10),
            shiftStart: user.shiftStart,
            shiftEnd: user.shiftEnd,
            isMaster: user.isMaster,
            priority
        };
    }
};
exports.ShiftUserResponseMapper = ShiftUserResponseMapper;
exports.ShiftUserResponseMapper = ShiftUserResponseMapper = __decorate([
    (0, common_1.Injectable)()
], ShiftUserResponseMapper);
//# sourceMappingURL=shift-user-response.mapper.js.map