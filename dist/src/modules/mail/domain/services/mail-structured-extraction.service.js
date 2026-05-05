"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailStructuredExtractionService = void 0;
const common_1 = require("@nestjs/common");
const HIGH_PRIORITY_TERMS = [
    "critical",
    "critico",
    "crítico",
    "urgente",
    "caida",
    "caída",
    "severidad alta",
    "severidad 1",
    "sev1",
    "impacto alto",
    "servicio caido",
    "servicio caído"
];
const MEDIUM_PRIORITY_TERMS = [
    "incidente",
    "alerta",
    "error",
    "falla",
    "afectacion",
    "afectación",
    "ticket",
    "monitoreo",
    "degradacion",
    "degradación",
    "lentitud"
];
let MailStructuredExtractionService = class MailStructuredExtractionService {
    extract(input) {
        const normalizedSubject = this.normalizeText(input.subject ?? "");
        const normalizedBody = this.normalizeText(input.bodyText ?? "");
        const clientName = this.resolveClientName(input);
        const importantLines = this.extractImportantLines(normalizedSubject, normalizedBody);
        const summary = this.buildIncidentSummary(normalizedSubject, importantLines);
        const priority = this.estimatePriority(normalizedSubject, normalizedBody);
        const context = this.buildContext(normalizedSubject, importantLines);
        const voiceText = this.buildVoiceText({
            clientName,
            priority,
            summary,
            context
        });
        return {
            extractedClientName: clientName,
            incidentSummary: summary,
            estimatedPriority: priority,
            mainContext: context,
            voiceText,
            extractionEngine: "heuristic-v1"
        };
    }
    resolveClientName(input) {
        if (input.detectedClientName?.trim()) {
            return input.detectedClientName.trim();
        }
        if (input.fromName?.trim()) {
            return input.fromName.trim();
        }
        const [localPart, domain] = input.fromEmail.split("@");
        if (domain) {
            return domain.replace(/\.[a-z]+$/i, "").replace(/[.\-_]/g, " ").trim() || localPart;
        }
        return localPart || "Cliente no identificado";
    }
    buildIncidentSummary(subject, lines) {
        const candidate = lines.find((line) => line.length >= 20) ?? subject;
        if (!candidate) {
            return "Correo relevante recibido sin suficiente detalle textual para resumir.";
        }
        return this.compactText(candidate, 220);
    }
    buildContext(subject, lines) {
        const candidates = lines.filter((line) => line.length >= 12);
        const contextParts = [];
        if (subject) {
            contextParts.push(`Asunto: ${this.compactText(subject, 120)}`);
        }
        for (const line of candidates) {
            if (contextParts.length >= 3) {
                break;
            }
            if (!contextParts.some((existing) => existing.includes(line))) {
                contextParts.push(this.compactText(line, 140));
            }
        }
        return contextParts.join(" | ") || "Sin contexto adicional identificable.";
    }
    estimatePriority(subject, body) {
        const haystack = `${subject}\n${body}`.toLowerCase();
        if (HIGH_PRIORITY_TERMS.some((term) => haystack.includes(term))) {
            return "ALTA";
        }
        if (MEDIUM_PRIORITY_TERMS.some((term) => haystack.includes(term))) {
            return "MEDIA";
        }
        return "BAJA";
    }
    buildVoiceText(input) {
        return this.compactText(`Alerta para ${input.clientName}. Prioridad ${input.priority}. Resumen: ${input.summary}. Contexto principal: ${input.context}.`, 420);
    }
    extractImportantLines(subject, body) {
        const rawLines = `${subject}\n${body}`
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        return rawLines.filter((line) => {
            const lowered = line.toLowerCase();
            if (lowered.length < 8) {
                return false;
            }
            if (lowered.startsWith("de:") ||
                lowered.startsWith("from:") ||
                lowered.startsWith("enviado:") ||
                lowered.startsWith("sent:") ||
                lowered.startsWith("para:") ||
                lowered.startsWith("subject:")) {
                return false;
            }
            if (lowered.includes("confidentiality notice") || lowered.includes("este mensaje y sus anexos")) {
                return false;
            }
            return true;
        });
    }
    normalizeText(value) {
        return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
    }
    compactText(value, maxLength) {
        const compacted = value.replace(/\s+/g, " ").trim();
        if (compacted.length <= maxLength) {
            return compacted;
        }
        return `${compacted.slice(0, maxLength - 3).trim()}...`;
    }
};
exports.MailStructuredExtractionService = MailStructuredExtractionService;
exports.MailStructuredExtractionService = MailStructuredExtractionService = __decorate([
    (0, common_1.Injectable)()
], MailStructuredExtractionService);
//# sourceMappingURL=mail-structured-extraction.service.js.map