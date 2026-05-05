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
const DEFAULT_INCIDENT_KEYWORDS = [
    "incidente",
    "severidad",
    "alert",
    "alerta",
    "afectacion",
    "afectación",
    "impacto",
    "monitor",
    "caida",
    "caída",
    "falla",
    "error",
    "interrupcion",
    "interrupción",
    "equipo",
    "servicio",
    "logs",
    "reinicio",
    "funcional",
    "resuelto",
    "modo conservativo",
    "deteccion",
    "detección",
    "acciones tomadas",
    "origen",
    "ver incidente"
];
const DEFAULT_CLIENT_KEYWORDS = [
    "cliente",
    "empresa",
    "union agronegocios",
    "union agronegocios",
    "xoc"
];
const DEFAULT_BLOCKED_KEYWORDS = [
    "newsletter",
    "unsubscribe",
    "oferta exclusiva",
    "promocion",
    "promoción",
    "feliz cumpleaños",
    "cumpleaños",
    "almuerzo",
    "casino",
    "bitcoin",
    "loan"
];
const REQUIRED_XOC_KEYWORD = "xoc";
let EmailClassificationService = class EmailClassificationService {
    evaluate(input) {
        const subject = input.subject ?? "";
        const bodyText = input.bodyText ?? "";
        const normalizedText = `${subject}\n${bodyText}`.toLowerCase();
        const sender = input.fromEmail.trim().toLowerCase();
        const senderDomain = sender.includes("@") ? sender.split("@")[1] : "";
        const matchedRules = [];
        const reasons = [];
        let score = 0;
        if (input.spamScore >= input.spamScoreLimit) {
            return {
                status: client_1.MessageStatus.SPAM,
                classificationReason: input.spamReason ?? "Clasificado como spam por el filtro base",
                classificationConfidence: 100,
                matchedRules: ["spam-score-limit"],
                detectedClientName: this.detectClientName(bodyText, input.fromName)
            };
        }
        const detectedClientName = this.detectClientName(bodyText, input.fromName);
        const hasXocRelation = this.hasXocRelation({
            sender,
            senderDomain,
            subject,
            bodyText,
            fromName: input.fromName,
            detectedClientName
        });
        if (!hasXocRelation) {
            return {
                status: client_1.MessageStatus.IRRELEVANT,
                classificationReason: "Correo descartado: no se detecta relacion con XOC",
                classificationConfidence: 95,
                matchedRules: ["xoc-required"],
                detectedClientName
            };
        }
        matchedRules.push("xoc-required");
        reasons.push("Se detecto relacion explicita con XOC");
        if (this.includesAny(input.config.allowedSenders, sender)) {
            score += 35;
            matchedRules.push("allowed-sender");
            reasons.push("El remitente esta autorizado por regla");
        }
        if (this.includesAny(input.config.allowedDomains, senderDomain)) {
            score += 25;
            matchedRules.push("allowed-domain");
            reasons.push("El dominio del remitente esta autorizado");
        }
        const incidentKeywords = this.mergeKeywords(DEFAULT_INCIDENT_KEYWORDS, input.config.incidentKeywords);
        const incidentMatches = incidentKeywords.filter((keyword) => normalizedText.includes(keyword));
        if (incidentMatches.length > 0) {
            score += Math.min(incidentMatches.length * 9, 45);
            matchedRules.push("incident-keywords");
            reasons.push(`Contiene senales operativas: ${incidentMatches.slice(0, 4).join(", ")}`);
        }
        const clientKeywords = this.mergeKeywords(DEFAULT_CLIENT_KEYWORDS, input.config.clientKeywords);
        const clientMatches = clientKeywords.filter((keyword) => normalizedText.includes(keyword));
        if (clientMatches.length > 0) {
            score += Math.min(clientMatches.length * 8, 24);
            matchedRules.push("client-keywords");
            reasons.push(`Referencia cliente/empresa detectada: ${clientMatches.slice(0, 3).join(", ")}`);
        }
        if (/\b(inc|ticket|case)-?[a-z0-9-]{4,}\b/i.test(normalizedText)) {
            score += 16;
            matchedRules.push("incident-reference");
            reasons.push("Se detecto un identificador de incidente o ticket");
        }
        if (/\b(severidad|alerta|alert|critical|critico|crítico|afectacion|afectación)\b/i.test(normalizedText)) {
            score += 12;
            matchedRules.push("severity-pattern");
            reasons.push("El correo expresa severidad o afectacion operativa");
        }
        if (/\b(resuelto|resolved)\b/i.test(normalizedText)) {
            score += 5;
            matchedRules.push("resolved-incident");
            reasons.push("El correo parece parte de una cadena de incidente resuelto");
        }
        const blockedKeywords = this.mergeKeywords(DEFAULT_BLOCKED_KEYWORDS, input.config.blockedKeywords);
        const blockedMatches = blockedKeywords.filter((keyword) => normalizedText.includes(keyword));
        if (blockedMatches.length > 0) {
            score -= Math.min(blockedMatches.length * 12, 48);
            matchedRules.push("blocked-keywords");
            reasons.push(`Contiene senales no operativas: ${blockedMatches.slice(0, 3).join(", ")}`);
        }
        if (/\b(hola|gracias|saludos|buenos dias|buenas tardes)\b/i.test(normalizedText) && incidentMatches.length === 0) {
            score -= 10;
            matchedRules.push("casual-language");
            reasons.push("Predomina lenguaje casual sin contexto operativo");
        }
        if (sender.includes("noreply") || sender.includes("no-reply")) {
            score += 4;
            matchedRules.push("automated-sender");
            reasons.push("Parece un remitente automatico");
        }
        if (detectedClientName) {
            score += 8;
            matchedRules.push("detected-client-name");
            reasons.push(`Cliente detectado: ${detectedClientName}`);
        }
        const status = score >= 35 ? client_1.MessageStatus.APPROVED : client_1.MessageStatus.IRRELEVANT;
        const classificationConfidence = this.toConfidence(score, status);
        return {
            status,
            classificationReason: reasons.join("; ") ||
                (status === client_1.MessageStatus.APPROVED
                    ? "Correo aceptado por coincidencia operativa"
                    : "Correo descartado por falta de senales operativas"),
            classificationConfidence,
            matchedRules,
            detectedClientName
        };
    }
    detectClientName(bodyText, fallbackName) {
        const lines = (bodyText ?? "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 20);
        for (const line of lines) {
            if (line.length >= 4 &&
                line.length <= 60 &&
                /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ0-9&.\- ]+$/.test(line) &&
                !/\b(incidente|severidad|resuelto|deteccion|origen|equipo|acciones)\b/i.test(line)) {
                return line;
            }
        }
        return fallbackName?.trim() || null;
    }
    mergeKeywords(defaults, custom) {
        return Array.from(new Set([...defaults, ...custom.map((value) => value.toLowerCase())]));
    }
    includesAny(values, target) {
        const normalizedTarget = target.toLowerCase();
        return values.map((value) => value.toLowerCase()).includes(normalizedTarget);
    }
    hasXocRelation(input) {
        const candidates = [
            input.sender,
            input.senderDomain,
            input.subject,
            input.bodyText,
            input.fromName ?? "",
            input.detectedClientName ?? ""
        ].map((value) => value.toLowerCase());
        return candidates.some((value) => value.includes(REQUIRED_XOC_KEYWORD));
    }
    toConfidence(score, status) {
        if (status === client_1.MessageStatus.APPROVED) {
            return Math.max(55, Math.min(99, 55 + score));
        }
        return Math.max(50, Math.min(98, 80 - score));
    }
};
exports.EmailClassificationService = EmailClassificationService;
exports.EmailClassificationService = EmailClassificationService = __decorate([
    (0, common_1.Injectable)()
], EmailClassificationService);
//# sourceMappingURL=email-classification.service.js.map