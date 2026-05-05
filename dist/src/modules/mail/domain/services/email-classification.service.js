"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailClassificationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const XOC_INCIDENT_SENDER_PATTERN = /^incidente_xoc\d+@grupogoit\.com$/i;
let EmailClassificationService = class EmailClassificationService {
    evaluate(input) {
        const sender = input.fromEmail.trim().toLowerCase();
        if (input.spamScore >= input.spamScoreLimit) {
            return {
                status: client_1.MessageStatus.SPAM,
                classificationReason: input.spamReason ?? "Clasificado como spam por el filtro base",
                classificationConfidence: 100,
                matchedRules: ["spam-score-limit"],
                detectedClientName: null
            };
        }
        if (XOC_INCIDENT_SENDER_PATTERN.test(sender)) {
            return {
                status: client_1.MessageStatus.APPROVED,
                classificationReason: "Correo aprobado por remitente operativo XOC reconocido",
                classificationConfidence: 99,
                matchedRules: ["xoc-incident-sender"],
                detectedClientName: null
            };
        }
        return {
            status: client_1.MessageStatus.IRRELEVANT,
            classificationReason: "Correo descartado: el remitente no coincide con el patron operativo XOC",
            classificationConfidence: 95,
            matchedRules: ["sender-pattern-mismatch"],
            detectedClientName: null
        };
    }
};
exports.EmailClassificationService = EmailClassificationService;
exports.EmailClassificationService = EmailClassificationService = __decorate([
    (0, common_1.Injectable)()
], EmailClassificationService);
//# sourceMappingURL=email-classification.service.js.map