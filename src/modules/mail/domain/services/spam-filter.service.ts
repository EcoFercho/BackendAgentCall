import { Injectable } from "@nestjs/common";

export interface SpamCheckInput {
  labels: string[];
  fromEmail: string;
  subject?: string | null;
  bodyText?: string | null;
}

@Injectable()
export class SpamFilterService {
  evaluate(input: SpamCheckInput) {
    let score = 0;
    const reasons: string[] = [];
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
}
