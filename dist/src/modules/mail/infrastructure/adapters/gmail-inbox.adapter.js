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
exports.GmailInboxAdapter = void 0;
const common_1 = require("@nestjs/common");
const gmail_service_1 = require("../services/gmail.service");
let GmailInboxAdapter = class GmailInboxAdapter {
    constructor(gmailService) {
        this.gmailService = gmailService;
    }
    async getConfig() {
        return this.gmailService.getConfig();
    }
    async saveConfig(command) {
        return this.gmailService.saveConfig(command);
    }
    async testConnection(command) {
        return this.gmailService.testConnection(command);
    }
    async getApprovedMessages() {
        return this.gmailService.getApprovedMessages();
    }
    async getClassifiedMessages() {
        return this.gmailService.getClassifiedMessages();
    }
    async getMessageSummary() {
        return this.gmailService.getMessageSummary();
    }
    async generateIncidentSummary(messageId) {
        return this.gmailService.generateIncidentSummary(messageId);
    }
    async syncInbox() {
        return this.gmailService.syncInbox();
    }
};
exports.GmailInboxAdapter = GmailInboxAdapter;
exports.GmailInboxAdapter = GmailInboxAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gmail_service_1.GmailService])
], GmailInboxAdapter);
//# sourceMappingURL=gmail-inbox.adapter.js.map