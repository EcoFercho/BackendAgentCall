"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpamFilterService = void 0;
const common_1 = require("@nestjs/common");
let SpamFilterService = class SpamFilterService {
    evaluate(input) {
        let score = 0;
        const reasons = [];
        const body = `${input.subject ?? ""} ${input.bodyText ?? ""}`.toLowerCase();
        const sender = input.fromEmail.toLowerCase();
        const labels = input.labels.map((label) => label.toUpperCase());
        if (labels.includes("\\SPAM") || labels.includes("SPAM")) {
            score += 90;
            reasons.push("Gmail marco el correo en spam");
        }
        const suspiciousTerms = [
            "ganaste",
            "premio",
            "urgente",
            "bitcoin",
            "oferta exclusiva",
            "haz clic",
            "verifica tu cuenta",
            "free",
            "casino",
            "loan"
        ];
        for (const term of suspiciousTerms) {
            if (body.includes(term)) {
                score += 8;
            }
        }
        if (sender.endsWith(".ru") || sender.includes("noreply") || sender.includes("promo")) {
            score += 10;
            reasons.push("Remitente sospechoso");
        }
        if ((input.subject ?? "").replace(/[a-z0-9\s]/gi, "").length > 6) {
            score += 6;
            reasons.push("Asunto con puntuacion anomala");
        }
        if ((input.bodyText ?? "").length < 20) {
            score += 5;
        }
        return {
            score,
            reasons: reasons.join("; ") || "Sin alertas relevantes"
        };
    }
};
exports.SpamFilterService = SpamFilterService;
exports.SpamFilterService = SpamFilterService = __decorate([
    (0, common_1.Injectable)()
], SpamFilterService);
//# sourceMappingURL=spam-filter.service.js.map