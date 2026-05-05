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
exports.GmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const gmail_service_1 = require("./gmail.service");
const save_gmail_config_dto_1 = require("./dto/save-gmail-config.dto");
const test_gmail_connection_dto_1 = require("./dto/test-gmail-connection.dto");
let GmailController = class GmailController {
    constructor(gmailService) {
        this.gmailService = gmailService;
    }
    getConfig() {
        return this.gmailService.getConfig();
    }
    saveConfig(body) {
        return this.gmailService.saveConfig(body);
    }
    testConnection(body) {
        return this.gmailService.testConnection(body);
    }
    getApprovedMessages() {
        return this.gmailService.getApprovedMessages();
    }
    getClassifiedMessages() {
        return this.gmailService.getClassifiedMessages();
    }
    syncInbox() {
        return this.gmailService.syncInbox();
    }
};
exports.GmailController = GmailController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Obtener la configuracion de Gmail guardada" }),
    (0, common_1.Get)("config"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "getConfig", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Guardar la configuracion de Gmail" }),
    (0, common_1.Post)("config"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [save_gmail_config_dto_1.SaveGmailConfigDto]),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "saveConfig", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Probar la conexion a Gmail con los datos enviados" }),
    (0, common_1.Post)("config/test"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_gmail_connection_dto_1.TestGmailConnectionDto]),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "testConnection", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Listar mensajes aprobados" }),
    (0, common_1.Get)("messages"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "getApprovedMessages", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Listar mensajes clasificados con motivo y confianza" }),
    (0, common_1.Get)("messages/classified"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "getClassifiedMessages", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Sincronizar la bandeja y procesar mensajes" }),
    (0, common_1.Post)("sync"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "syncInbox", null);
exports.GmailController = GmailController = __decorate([
    (0, swagger_1.ApiTags)("Gmail"),
    (0, swagger_1.ApiBearerAuth)("bearerAuth"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("gmail"),
    __metadata("design:paramtypes", [gmail_service_1.GmailService])
], GmailController);
//# sourceMappingURL=gmail.controller.js.map