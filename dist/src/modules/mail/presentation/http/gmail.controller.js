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
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const get_gmail_config_use_case_1 = require("../../application/use-cases/get-gmail-config.use-case");
const get_message_summary_use_case_1 = require("../../application/use-cases/get-message-summary.use-case");
const list_approved_messages_use_case_1 = require("../../application/use-cases/list-approved-messages.use-case");
const list_classified_messages_use_case_1 = require("../../application/use-cases/list-classified-messages.use-case");
const save_gmail_config_use_case_1 = require("../../application/use-cases/save-gmail-config.use-case");
const sync_gmail_inbox_use_case_1 = require("../../application/use-cases/sync-gmail-inbox.use-case");
const test_gmail_connection_use_case_1 = require("../../application/use-cases/test-gmail-connection.use-case");
const save_gmail_config_dto_1 = require("./dto/save-gmail-config.dto");
const test_gmail_connection_dto_1 = require("./dto/test-gmail-connection.dto");
let GmailController = class GmailController {
    constructor(getGmailConfigUseCase, getMessageSummaryUseCase, saveGmailConfigUseCase, testGmailConnectionUseCase, listApprovedMessagesUseCase, listClassifiedMessagesUseCase, syncGmailInboxUseCase) {
        this.getGmailConfigUseCase = getGmailConfigUseCase;
        this.getMessageSummaryUseCase = getMessageSummaryUseCase;
        this.saveGmailConfigUseCase = saveGmailConfigUseCase;
        this.testGmailConnectionUseCase = testGmailConnectionUseCase;
        this.listApprovedMessagesUseCase = listApprovedMessagesUseCase;
        this.listClassifiedMessagesUseCase = listClassifiedMessagesUseCase;
        this.syncGmailInboxUseCase = syncGmailInboxUseCase;
    }
    getConfig() {
        return this.getGmailConfigUseCase.execute();
    }
    saveConfig(body) {
        return this.saveGmailConfigUseCase.execute(body);
    }
    testConnection(body) {
        return this.testGmailConnectionUseCase.execute(body);
    }
    getApprovedMessages() {
        return this.listApprovedMessagesUseCase.execute();
    }
    getClassifiedMessages() {
        return this.listClassifiedMessagesUseCase.execute();
    }
    getMessageSummary() {
        return this.getMessageSummaryUseCase.execute();
    }
    syncInbox() {
        return this.syncGmailInboxUseCase.execute();
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
    (0, swagger_1.ApiOperation)({ summary: "Obtener resumen de conteo de mensajes clasificados" }),
    (0, common_1.Get)("messages/summary"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GmailController.prototype, "getMessageSummary", null);
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
    __metadata("design:paramtypes", [get_gmail_config_use_case_1.GetGmailConfigUseCase,
        get_message_summary_use_case_1.GetMessageSummaryUseCase,
        save_gmail_config_use_case_1.SaveGmailConfigUseCase,
        test_gmail_connection_use_case_1.TestGmailConnectionUseCase,
        list_approved_messages_use_case_1.ListApprovedMessagesUseCase,
        list_classified_messages_use_case_1.ListClassifiedMessagesUseCase,
        sync_gmail_inbox_use_case_1.SyncGmailInboxUseCase])
], GmailController);
//# sourceMappingURL=gmail.controller.js.map