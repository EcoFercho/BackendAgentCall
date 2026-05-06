import { BadRequestException, Injectable } from "@nestjs/common";
import { LlmConfig as PersistedLlmConfig, LlmProviderType } from "@prisma/client";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ListLlmModelsDto } from "./presentation/http/dto/list-llm-models.dto";
import { REMOTE_LLM_PROVIDERS, RemoteLlmProvider, SaveLlmConfigDto } from "./presentation/http/dto/save-llm-config.dto";

const DEFAULT_CONFIG_KEY = "default";
type IncidentMetadata = {
  category: string | null;
  status: string | null;
  severity: string | null;
};
type GeneratedIncidentSummary = IncidentMetadata & {
  summary: string;
  provider: LlmProviderType;
  providerName: "LOCAL" | RemoteLlmProvider;
  model: string;
};
const DEFAULT_LLM_REFERENCE_MARKDOWN = `# Skill: Analista de Incidentes SOC y NOC
## Rol
Eres un analista tecnico de incidentes de seguridad e infraestructura. Debes leer texto libre, correos, alertas, tickets o bloques mezclados y devolver un reporte estructurado exactamente en el formato indicado.

## Objetivo
Convertir entradas desordenadas en un resumen tecnico-operativo consistente, identificando cliente, codigo, equipo, severidad, estado, origen, objeto y afectacion.

## Reglas obligatorias
1. Devuelve solo el resultado final.
2. Usa exactamente los encabezados, etiquetas y orden definidos abajo.
3. Todos los encabezados de seccion deben ir en MAYUSCULAS y sin simbolos Markdown. Nunca uses #, ##, bullets ni decoradores.
4. Si un dato no existe, escribe: No especificado o No especificada segun corresponda.
5. Debes identificar el cliente si aparece como cliente explicito, ciudad, sitio, sucursal o entidad comercial. Ejemplos: Monterrey, Grupo Venado S.A.
6. No inventes fechas, severidades, estados, codigos, IPs o numeros de incidente.
7. El campo Estado debe reflejar el estado visible en el texto; si no aparece, usa No especificado.
8. Impacto potencial puede ocupar varias lineas, una idea por linea, sin vinetas.
9. El RESUMEN TECNICO DEL INCIDENTE debe tener mas de 180 caracteres y menos de 430 caracteres.
10. El RESUMEN TECNICO DEL INCIDENTE debe empezar siempre con el nombre del cliente. Si no se puede identificar, debe empezar con No especificado.
11. El RESUMEN TECNICO DEL INCIDENTE debe ser mas explicito: incluir causa o evento detectado, activo afectado, impacto operativo y contexto tecnico si existe.
12. No uses JSON, tablas ni comentarios fuera de la estructura.
13. Si el incidente menciona NOC, AP leave, desconexion, hardware, fallo fisico, enlace o disponibilidad, clasificalo como Incidente de infraestructura.
14. Si el texto tiene un resumen narrativo al inicio y luego bloques de datos, usa ambos: el narrativo para causa e impacto, y los bloques para campos exactos.
15. Ignora frases de pie de pagina como Optimizado por..., Ver incidente, Generado automaticamente, No responder, enlaces y textos comerciales.

## Plantilla obligatoria
RESUMEN DEL INCIDENTE
Tipo: <valor>
Fecha deteccion: <valor>
Hora deteccion: <valor>
Origen: <valor>
Destino: <valor>
Amenaza detectada: <valor>
Impacto potencial:
<valor>
Estado: <valor>

DATOS DEL CLIENTE
Cliente: <valor>
Codigo de incidente: <valor>
Numero de incidente cliente: <valor>
Severidad: <valor>
Estado: <valor>
Fecha del incidente: <valor>

INFRAESTRUCTURA AFECTADA
Equipo: <valor>
Generado por: <valor>
Motor: <valor>

DETALLES TECNICOS DEL INCIDENTE
Origen (IP interna): <valor>
Destino (IP externa): <valor>
Subcategoria: <valor>
Objeto en cuestion: <valor>
Tipo de comunicacion: <valor>

RESUMEN TECNICO DEL INCIDENTE

<parrafo entre 140 y 420 caracteres que comience con el nombre del cliente>

## Criterios de extraccion
- Cliente puede venir como nombre de empresa, ciudad, sitio, sucursal, tenant o referencia comercial.
- Si aparece un codigo tipo INC-Y26-..., usalo como Codigo de incidente.
- Si aparece Num. Inc. Cliente, Numero de incidente cliente o similar, usalo literalmente.
- Si aparece Fecha y hora generado en un solo campo, separa fecha y hora cuando sea posible.
- Si aparece solo fecha completa tipo 2026-04-30 14:45:02, usa Fecha deteccion 30/04/2026 y Hora deteccion 14:45:02.
- En Origen del bloque inicial usa equipo, sistema o interfaz principal.
- En Origen (IP interna) y Destino (IP externa) usa solo IPs. Si no existen, deja No especificado.
- Si el objeto contiene Physical AP leave o texto equivalente, Tipo de comunicacion debe reflejar desconexion fisica de punto de acceso o equivalente tecnico.
- Si la afectacion dice Equipo desconectado del fortiGate, el impacto debe reflejar interrupcion de servicio, perdida de conectividad o afectacion de acceso solo si el texto lo justifica.
- Amenaza detectada no tiene que ser malware; puede ser evento tecnico, por ejemplo desconexion de AP por fallo fisico.
- El RESUMEN TECNICO DEL INCIDENTE debe sonar profesional, directo y coherente con causa, impacto y contexto, iniciando obligatoriamente con el cliente.
- El RESUMEN TECNICO DEL INCIDENTE debe explicar que paso, sobre que activo, por que es relevante y cual es el efecto operativo observado o potencial.

## Ejemplos de referencia
Entrada tipo 1: Incidente de Infraestructura · Severidad Alta / Identificado / XOC / INC-Y26-1163295 / 2026-04-30 14:45:02 / Monterrey / resumen narrativo / FGT 60F / FIREWALL / Monitor: NOC / objeto / afectacion / acciones.
Claves esperadas tipo 1: Tipo=Incidente de infraestructura, Cliente=Monterrey, Codigo=INC-Y26-1163295, Equipo=FGT-60F-MR-SUC02 o equipo equivalente en objeto, Generado por=XOC, Motor=NOC.
Entrada tipo 2: Resumen narrativo + Datos del cliente + Informacion del incidente + Informacion adicional.
Claves esperadas tipo 2: Cliente=Grupo Venado S.A., Codigo=INC-Y26-1163157, Equipo afectado=FGT40FTK2309B6TZ, Objeto en cuestion con Physical AP leave, Estado=Identificado.

## Texto del usuario
\${$json.userText}

## Respuesta:`;
const REMOTE_PROVIDER_PRESETS: Record<RemoteLlmProvider, { baseUrl: string; generatePath: string }> = {
  OPENAI: {
    baseUrl: "https://api.openai.com",
    generatePath: "/v1/responses"
  },
  ANTHROPIC: {
    baseUrl: "https://api.anthropic.com",
    generatePath: "/v1/messages"
  },
  GOOGLE: {
    baseUrl: "https://generativelanguage.googleapis.com",
    generatePath: "/v1beta/models/{model}:generateContent"
  }
};

@Injectable()
export class LlmConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async normalizeIncidentSummary(value: string) {
    const referenceMarkdown = await this.getCurrentReferenceMarkdown();
    const normalized = this.extractFinalIncidentSummary(value, referenceMarkdown);
    if (!this.matchesConfiguredTemplate(normalized, referenceMarkdown)) {
      throw new BadRequestException("El reporte no respeta la estructura completa configurada.");
    }

    return normalized;
  }

  async isCompleteIncidentSummary(value?: string | null) {
    if (!value?.trim()) {
      return false;
    }

    const referenceMarkdown = await this.getCurrentReferenceMarkdown();
    return this.matchesConfiguredTemplate(value, referenceMarkdown);
  }

  async getConfig() {
    const config = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });

    return this.mapConfig(config);
  }

  async saveConfig(command: SaveLlmConfigDto) {
    const existing = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });

    const providerName = this.normalizeRemoteProvider(command.apiProviderName);
    const normalizedApiKey = command.apiKey?.trim();
    const nextApiKey = normalizedApiKey
      ? this.encryptSecret(normalizedApiKey)
      : existing?.apiKey;
    const apiPreset = providerName ? REMOTE_PROVIDER_PRESETS[providerName] : null;
    const referenceMarkdown = this.normalizeReferenceMarkdown(
      command.referenceMarkdown,
      existing?.referenceMarkdown ?? DEFAULT_LLM_REFERENCE_MARKDOWN
    );

    if (command.activeProvider === LlmProviderType.API) {
      if (!providerName) {
        throw new BadRequestException("Selecciona un proveedor API.");
      }

      if (!nextApiKey) {
        throw new BadRequestException("Pega una API key antes de guardar la configuracion remota.");
      }

      if (!command.apiModel?.trim()) {
        throw new BadRequestException("Selecciona un modelo remoto antes de guardar.");
      }
    }

    const saved = await this.prisma.llmConfig.upsert({
      where: { configKey: DEFAULT_CONFIG_KEY },
      update: {
        activeProvider: command.activeProvider,
        localBaseUrl: this.normalizeUrlLike(command.localBaseUrl),
        localGeneratePath: this.normalizePath(command.localGeneratePath),
        localModel: command.localModel.trim(),
        localTimeoutMs: command.localTimeoutMs,
        apiProviderName: providerName,
        apiBaseUrl: apiPreset?.baseUrl ?? this.normalizeOptionalUrlLike(command.apiBaseUrl),
        apiGeneratePath: apiPreset?.generatePath ?? this.normalizeOptionalPath(command.apiGeneratePath),
        apiModel: this.normalizeOptionalString(command.apiModel),
        apiKey: nextApiKey,
        apiTimeoutMs: command.apiTimeoutMs,
        referenceMarkdown
      },
      create: {
        configKey: DEFAULT_CONFIG_KEY,
        activeProvider: command.activeProvider,
        localBaseUrl: this.normalizeUrlLike(command.localBaseUrl),
        localGeneratePath: this.normalizePath(command.localGeneratePath),
        localModel: command.localModel.trim(),
        localTimeoutMs: command.localTimeoutMs,
        apiProviderName: providerName,
        apiBaseUrl: apiPreset?.baseUrl ?? this.normalizeOptionalUrlLike(command.apiBaseUrl),
        apiGeneratePath: apiPreset?.generatePath ?? this.normalizeOptionalPath(command.apiGeneratePath),
        apiModel: this.normalizeOptionalString(command.apiModel),
        apiKey: nextApiKey,
        apiTimeoutMs: command.apiTimeoutMs,
        referenceMarkdown
      }
    });

    return this.mapConfig(saved);
  }

  async listModels(command: ListLlmModelsDto) {
    const existing = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });

    if (command.providerType === LlmProviderType.LOCAL) {
      const defaults = this.getDefaultConfig();
      const baseUrl = command.localBaseUrl?.trim() || existing?.localBaseUrl || defaults.localBaseUrl;
      return this.fetchLocalModels(baseUrl);
    }

    const providerName = this.normalizeRemoteProvider(command.providerName);
    if (!providerName) {
      throw new BadRequestException("Selecciona un proveedor API valido.");
    }

    const apiKey = command.apiKey?.trim() || this.tryDecryptSecret(existing?.apiKey ?? null);
    if (!apiKey) {
      throw new BadRequestException("No hay una API key disponible para consultar modelos.");
    }

    switch (providerName) {
      case "OPENAI":
        return this.fetchOpenAiModels(apiKey);
      case "ANTHROPIC":
        return this.fetchAnthropicModels(apiKey);
      case "GOOGLE":
        return this.fetchGoogleModels(apiKey);
    }
  }

  async generateIncidentSummary(userText: string) {
    const sourceText = this.normalizeIncidentSourceText(userText);

    if (!sourceText) {
      throw new BadRequestException("No hay contenido suficiente para generar el incidente.");
    }

    const config = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });
    const defaults = this.getDefaultConfig();
    const prompt = this.buildIncidentPrompt(
      config?.referenceMarkdown ?? defaults.referenceMarkdown,
      sourceText
    );
    const generated = await this.generateConfiguredText(prompt, config, defaults);

    return {
      summary: await this.normalizeIncidentSummaryWithReference(
        generated.text,
        config?.referenceMarkdown ?? defaults.referenceMarkdown
      ),
      category: null,
      status: null,
      severity: null,
      provider: generated.provider,
      providerName: generated.providerName,
      model: generated.model
    } satisfies GeneratedIncidentSummary;
  }

  async generateIncidentMetadata(userText: string): Promise<IncidentMetadata> {
    const sourceText = this.normalizeIncidentSourceText(userText);
    if (!sourceText) {
      throw new BadRequestException("No hay contenido suficiente para clasificar el incidente.");
    }

    const config = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });
    const defaults = this.getDefaultConfig();
    const prompt = this.buildIncidentMetadataPrompt(sourceText);
    const generated = await this.generateConfiguredText(prompt, config, defaults);

    return this.parseIncidentMetadata(generated.text);
  }

  getDefaultConfig() {
    return {
      activeProvider: LlmProviderType.LOCAL,
      localBaseUrl: "http://127.0.0.1:11434",
      localGeneratePath: "/api/generate",
      localModel: "gemma4:26b",
      localTimeoutMs: 30000,
      apiProviderName: "",
      apiBaseUrl: "",
      apiGeneratePath: "",
      apiModel: "",
      apiKeyConfigured: false,
      apiTimeoutMs: 30000,
      referenceMarkdown: DEFAULT_LLM_REFERENCE_MARKDOWN
    };
  }

  private mapConfig(config: PersistedLlmConfig | null) {
    if (!config) {
      return this.getDefaultConfig();
    }

    return {
      id: config.id,
      activeProvider: config.activeProvider,
      localBaseUrl: config.localBaseUrl,
      localGeneratePath: config.localGeneratePath,
      localModel: config.localModel,
      localTimeoutMs: config.localTimeoutMs,
      apiProviderName: this.normalizeRemoteProvider(config.apiProviderName) ?? "",
      apiBaseUrl: config.apiBaseUrl ?? "",
      apiGeneratePath: config.apiGeneratePath ?? "",
      apiModel: config.apiModel ?? "",
      apiKeyConfigured: Boolean(this.tryDecryptSecret(config.apiKey)),
      apiTimeoutMs: config.apiTimeoutMs,
      referenceMarkdown: config.referenceMarkdown,
      updatedAt: config.updatedAt.toISOString()
    };
  }

  private normalizeUrlLike(value: string) {
    return value.trim().replace(/\/+$/, "");
  }

  private normalizePath(value: string) {
    const trimmed = value.trim();
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  private normalizeOptionalUrlLike(value?: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.replace(/\/+$/, "");
  }

  private normalizeOptionalPath(value?: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  private normalizeOptionalString(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeReferenceMarkdown(value: string | undefined, fallback: string) {
    if (value === undefined) {
      return fallback;
    }

    return value.replace(/\r\n?/g, "\n");
  }

  private normalizeRemoteProvider(value?: string | null) {
    const normalized = value?.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    if (normalized === "CLAUDE") {
      return "ANTHROPIC";
    }

    if (normalized === "GEMINI") {
      return "GOOGLE";
    }

    return REMOTE_LLM_PROVIDERS.includes(normalized as RemoteLlmProvider)
      ? (normalized as RemoteLlmProvider)
      : null;
  }

  private async generateConfiguredText(
    prompt: string,
    config: PersistedLlmConfig | null,
    defaults: ReturnType<LlmConfigService["getDefaultConfig"]>
  ) {
    const activeProvider = config?.activeProvider ?? defaults.activeProvider;

    if (activeProvider === LlmProviderType.LOCAL) {
      const model = config?.localModel ?? defaults.localModel;
      const timeoutMs = Math.max(config?.localTimeoutMs ?? defaults.localTimeoutMs, 120000);
      const text = await this.generateWithLocalProvider(
        {
          baseUrl: config?.localBaseUrl ?? defaults.localBaseUrl,
          generatePath: config?.localGeneratePath ?? defaults.localGeneratePath,
          model,
          timeoutMs
        },
        prompt
      );

      return {
        text,
        provider: activeProvider,
        providerName: "LOCAL" as const,
        model
      };
    }

    const providerName = this.normalizeRemoteProvider(config?.apiProviderName);
    if (!providerName) {
      throw new BadRequestException("No hay un proveedor API remoto configurado.");
    }

    const apiKey = this.tryDecryptSecret(config?.apiKey ?? null);
    if (!apiKey) {
      throw new BadRequestException("No hay una API key remota configurada para generar el incidente.");
    }

    const model = config?.apiModel?.trim();
    if (!model) {
      throw new BadRequestException("No hay un modelo remoto configurado para generar el incidente.");
    }

    const apiPreset = REMOTE_PROVIDER_PRESETS[providerName];
    const baseUrl = config?.apiBaseUrl ?? apiPreset.baseUrl;
    const generatePath = config?.apiGeneratePath ?? apiPreset.generatePath;
    const timeoutMs = Math.max(config?.apiTimeoutMs ?? defaults.apiTimeoutMs, 120000);
    const text = await this.generateWithRemoteProvider(
      providerName,
      {
        baseUrl,
        generatePath,
        model,
        apiKey,
        timeoutMs
      },
      prompt
    );

    return {
      text,
      provider: activeProvider,
      providerName,
      model
    };
  }

  private async generateWithLocalProvider(
    options: {
      baseUrl: string;
      generatePath: string;
      model: string;
      timeoutMs: number;
    },
    prompt: string
  ) {
    const data = await this.fetchJson<{
      response?: string;
      message?: { content?: string };
    }>("LOCAL", this.buildGenerateUrl(options.baseUrl, options.generatePath), {
      method: "POST",
      timeoutMs: options.timeoutMs,
      body: {
        model: options.model,
        prompt,
        stream: false
      }
    });

    const text = this.normalizeGeneratedText(data.response ?? data.message?.content ?? "");
    if (!text) {
      throw new BadRequestException("El runtime local no devolvio un resumen de incidente.");
    }

    return text;
  }

  private async generateWithRemoteProvider(
    providerName: RemoteLlmProvider,
    options: {
      baseUrl: string;
      generatePath: string;
      model: string;
      apiKey: string;
      timeoutMs: number;
    },
    prompt: string
  ) {
    switch (providerName) {
      case "OPENAI":
        return this.generateWithOpenAi(options, prompt);
      case "ANTHROPIC":
        return this.generateWithAnthropic(options, prompt);
      case "GOOGLE":
        return this.generateWithGoogle(options, prompt);
    }
  }

  private async generateWithOpenAi(
    options: {
      baseUrl: string;
      generatePath: string;
      model: string;
      apiKey: string;
      timeoutMs: number;
    },
    prompt: string
  ) {
    const data = await this.fetchJson<{
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    }>("OPENAI", this.buildGenerateUrl(options.baseUrl, options.generatePath), {
      method: "POST",
      timeoutMs: options.timeoutMs,
      headers: {
        Authorization: `Bearer ${options.apiKey}`
      },
      body: {
        model: options.model,
        input: prompt
      }
    });

    const nestedOutput =
      data.output
        ?.flatMap((item) => item.content ?? [])
        .filter((item) => item.type === "output_text" || item.type === "text")
        .map((item) => item.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n\n") ?? "";
    const text = this.normalizeGeneratedText(data.output_text ?? nestedOutput);

    if (!text) {
      throw new BadRequestException("OpenAI no devolvio un resumen de incidente.");
    }

    return text;
  }

  private async generateWithAnthropic(
    options: {
      baseUrl: string;
      generatePath: string;
      model: string;
      apiKey: string;
      timeoutMs: number;
    },
    prompt: string
  ) {
    const data = await this.fetchJson<{
      content?: Array<{ type?: string; text?: string }>;
    }>("ANTHROPIC", this.buildGenerateUrl(options.baseUrl, options.generatePath), {
      method: "POST",
      timeoutMs: options.timeoutMs,
      headers: {
        "anthropic-version": "2023-06-01",
        "x-api-key": options.apiKey
      },
      body: {
        model: options.model,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }
    });

    const text = this.normalizeGeneratedText(
      data.content
        ?.filter((item) => item.type === "text")
        .map((item) => item.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n\n") ?? ""
    );

    if (!text) {
      throw new BadRequestException("Anthropic no devolvio un resumen de incidente.");
    }

    return text;
  }

  private async generateWithGoogle(
    options: {
      baseUrl: string;
      generatePath: string;
      model: string;
      apiKey: string;
      timeoutMs: number;
    },
    prompt: string
  ) {
    const url = new URL(this.buildGenerateUrl(options.baseUrl, options.generatePath, options.model));
    url.searchParams.set("key", options.apiKey);

    const data = await this.fetchJson<{
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    }>("GOOGLE", url.toString(), {
      method: "POST",
      timeoutMs: options.timeoutMs,
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      }
    });

    const text = this.normalizeGeneratedText(
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n\n") ?? ""
    );

    if (!text) {
      throw new BadRequestException("Google no devolvio un resumen de incidente.");
    }

    return text;
  }

  private buildGenerateUrl(baseUrl: string, generatePath: string, model?: string) {
    const normalizedBaseUrl = this.normalizeUrlLike(baseUrl);
    const normalizedPath = this.normalizePath(generatePath);
    const resolvedPath = model ? normalizedPath.replace("{model}", encodeURIComponent(model)) : normalizedPath;
    return `${normalizedBaseUrl}${resolvedPath}`;
  }

  private buildIncidentPrompt(referenceMarkdown: string, userText: string) {
    const template = (referenceMarkdown || DEFAULT_LLM_REFERENCE_MARKDOWN).trim();
    const placeholderPattern = /\$\{\s*\$json\.userText\s*\}|\$json\.userText/g;

    if (!placeholderPattern.test(template)) {
      return `${this.unwrapTemplateDelimiters(template)}\n\nTexto del usuario:\n${userText}\n\nRespuesta:`;
    }

    return this.unwrapTemplateDelimiters(template)
      .replace(placeholderPattern, userText)
      .replace(/\r\n?/g, "\n")
      .trim();
  }

  private buildIncidentMetadataPrompt(userText: string) {
    return [
      "Analiza el siguiente correo de incidente y responde SOLO JSON valido.",
      'Usa exactamente este esquema: {"category":"...","status":"...","severity":"..."}',
      'category debe ser una de: "infraestructura", "seguridad", "aplicacion", "red", "desconocido"',
      'status debe ser una de: "resuelto", "investigando", "identificado", "desconocido"',
      'severity debe ser una de: "critica", "alta", "media", "baja", "desconocido"',
      "No agregues texto fuera del JSON.",
      "",
      "Correo:",
      userText
    ].join("\n");
  }

  private normalizeIncidentSourceText(value: string) {
    return value.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
  }

  private unwrapTemplateDelimiters(value: string) {
    let normalized = value.trim();

    normalized = normalized.replace(/^\s*\{\{\s*/, "").replace(/\s*\}\}\s*$/, "");
    normalized = normalized.replace(/^['"`]\s*/, "").replace(/\s*['"`]$/, "");

    return normalized;
  }

  private normalizeGeneratedText(value: string) {
    return value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  private extractFinalIncidentSummary(value: string, referenceMarkdown: string) {
    const legacySummary = this.extractSummaryFromLegacyJsonEnvelope(value);
    const normalized = this.normalizeGeneratedText(legacySummary ?? value);
    const fullReportMarker = this.extractTemplateMarkers(referenceMarkdown)[0] ?? "RESUMEN DEL INCIDENTE";
    const fullReportIndex = normalized.toUpperCase().lastIndexOf(fullReportMarker.toUpperCase());
    if (fullReportIndex >= 0) {
      return normalized.slice(fullReportIndex).trim();
    }

    throw new BadRequestException("El modelo no devolvio el reporte completo con la estructura requerida.");
  }

  private async getCurrentReferenceMarkdown() {
    const config = await this.prisma.llmConfig.findUnique({
      where: { configKey: DEFAULT_CONFIG_KEY }
    });

    return config?.referenceMarkdown ?? DEFAULT_LLM_REFERENCE_MARKDOWN;
  }

  private async normalizeIncidentSummaryWithReference(value: string, referenceMarkdown: string) {
    const normalized = this.extractFinalIncidentSummary(value, referenceMarkdown);
    if (!this.matchesConfiguredTemplate(normalized, referenceMarkdown)) {
      throw new BadRequestException("El reporte no respeta la estructura completa configurada.");
    }

    return normalized;
  }

  private matchesConfiguredTemplate(value: string, referenceMarkdown: string) {
    const normalized = this.normalizeGeneratedText(value);
    const markers = this.extractTemplateMarkers(referenceMarkdown);

    if (!markers.length) {
      return normalized.length > 0;
    }

    let searchFrom = 0;
    for (const marker of markers) {
      const index = normalized.indexOf(marker, searchFrom);
      if (index < 0) {
        return false;
      }

      searchFrom = index + marker.length;
    }

    return true;
  }

  private extractTemplateMarkers(referenceMarkdown: string) {
    const plantillaMatch = referenceMarkdown.match(/##\s*Plantilla obligatoria\s*([\s\S]*?)(?:\n##\s|$)/i);
    const plantillaBlock = plantillaMatch?.[1] ?? "";

    return plantillaBlock
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^<.+>$/.test(line))
      .map((line) => {
        if (!line.includes(":")) {
          return line;
        }

        return line.replace(/\s*<.*$/, "").trim();
      });
  }

  private extractSummaryFromLegacyJsonEnvelope(value: string) {
    const match = value
      .trim()
      .match(/"summary"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:category|provider|providerName|model)"/i);

    if (!match?.[1]) {
      return null;
    }

    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return match[1]
        .replace(/\\"/g, "\"")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\\/g, "\\");
    }
  }

  private parseIncidentMetadata(value: string): IncidentMetadata {
    const parsed = this.tryParseJsonObject(value);
    const category = this.normalizeIncidentCategory(parsed?.category);
    const status = this.normalizeIncidentStatus(parsed?.status);
    const severity = this.normalizeIncidentSeverity(parsed?.severity);

    return {
      category,
      status,
      severity
    };
  }

  private tryParseJsonObject(value: string) {
    const sanitized = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

    try {
      return JSON.parse(sanitized) as {
        summary?: string;
        category?: string;
        status?: string;
        severity?: string;
      };
    } catch {
      const match = sanitized.match(/\{[\s\S]*\}/);
      if (!match) {
        return null;
      }

        try {
          return JSON.parse(match[0]) as {
            summary?: string;
            category?: string;
            status?: string;
            severity?: string;
          };
      } catch {
        return null;
      }
    }
  }

  private normalizeIncidentCategory(value?: string | null) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (["infraestructura", "infra", "network", "red"].includes(normalized)) {
      return normalized === "network" || normalized === "red" ? "Red" : "Infraestructura";
    }

    if (["seguridad", "security"].includes(normalized)) {
      return "Seguridad";
    }

    if (["aplicacion", "aplicación", "application", "app"].includes(normalized)) {
      return "Aplicacion";
    }

    return "Desconocido";
  }

  private normalizeIncidentStatus(value?: string | null) {
    const normalized = this.normalizeIncidentMetaToken(value);
    if (!normalized) {
      return null;
    }

    if (normalized.includes("resuelto")) {
      return "Resuelto";
    }

    if (normalized.includes("investig")) {
      return "Investigando";
    }

    if (normalized.includes("identific")) {
      return "Identificado";
    }

    return "Desconocido";
  }

  private normalizeIncidentSeverity(value?: string | null) {
    const normalized = this.normalizeIncidentMetaToken(value);
    if (!normalized) {
      return null;
    }

    if (normalized.includes("crit")) {
      return "Critica";
    }

    if (normalized.includes("alta") || normalized === "high") {
      return "Alta";
    }

    if (normalized.includes("media") || normalized.includes("medi") || normalized === "medium") {
      return "Media";
    }

    if (normalized.includes("baja") || normalized === "low") {
      return "Baja";
    }

    return "Desconocido";
  }

  private normalizeIncidentMetaToken(value?: string | null) {
    return value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? null;
  }

  private async fetchOpenAiModels(apiKey: string) {
    const data = await this.fetchProviderJson<{
      data?: Array<{ id?: string }>;
    }>("OPENAI", "https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    return (data.data ?? [])
      .map((model) => model.id?.trim())
      .filter((modelId): modelId is string => Boolean(modelId))
      .sort((left, right) => left.localeCompare(right))
      .map((modelId) => ({ id: modelId, label: modelId }));
  }

  private async fetchAnthropicModels(apiKey: string) {
    const data = await this.fetchProviderJson<{
      data?: Array<{ id?: string; display_name?: string }>;
    }>("ANTHROPIC", "https://api.anthropic.com/v1/models", {
      headers: {
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey
      }
    });

    return (data.data ?? [])
      .filter((model): model is { id: string; display_name?: string } => Boolean(model.id?.trim()))
      .map((model) => ({
        id: model.id.trim(),
        label: model.display_name?.trim() || model.id.trim()
      }));
  }

  private async fetchGoogleModels(apiKey: string) {
    const params = new URLSearchParams({
      key: apiKey,
      pageSize: "1000"
    });

    const data = await this.fetchProviderJson<{
      models?: Array<{
        name?: string;
        displayName?: string;
        supportedGenerationMethods?: string[];
      }>;
    }>("GOOGLE", `https://generativelanguage.googleapis.com/v1beta/models?${params.toString()}`);

    return (data.models ?? [])
      .map((model) => {
        const modelId = model.name?.replace(/^models\//, "").trim() ?? "";
        return {
          id: modelId,
          label: model.displayName?.trim() || modelId
        };
      })
      .filter((model) => Boolean(model.id))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  private async fetchLocalModels(baseUrl: string) {
    const data = await this.fetchProviderJson<{
      models?: Array<{ name?: string; model?: string }>;
    }>("LOCAL" as RemoteLlmProvider, `${this.normalizeUrlLike(baseUrl)}/api/tags`);

    return (data.models ?? [])
      .map((model) => model.name?.trim() || model.model?.trim() || "")
      .filter((modelId): modelId is string => Boolean(modelId))
      .sort((left, right) => left.localeCompare(right))
      .map((modelId) => ({ id: modelId, label: modelId }));
  }

  private async fetchProviderJson<T>(
    providerName: RemoteLlmProvider,
    url: string,
    options?: {
      headers?: Record<string, string>;
    }
  ) {
    return this.fetchJson<T>(providerName, url, {
      method: "GET",
      headers: options?.headers,
      timeoutMs: 15000
    });
  }

  private async fetchJson<T>(
    providerName: string,
    url: string,
    options: {
      method: "GET" | "POST";
      headers?: Record<string, string>;
      body?: unknown;
      timeoutMs: number;
    }
  ) {
    const maxAttempts = options.method === "POST" ? 2 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const response = await fetch(url, {
          method: options.method,
          headers: {
            ...(options.body === undefined ? {} : { "content-type": "application/json" }),
            ...(options.headers ?? {})
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const canRetry = attempt < maxAttempts && (response.status >= 500 || response.status === 429);
          if (canRetry) {
            await this.delay(1200 * attempt);
            continue;
          }

          throw new BadRequestException(
            this.buildProviderErrorMessage(providerName, response.status, errorBody)
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;

        if (error instanceof BadRequestException) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new BadRequestException(`La solicitud a ${providerName} excedio el tiempo limite.`);
        }

        const canRetry = attempt < maxAttempts;
        if (canRetry) {
          await this.delay(1200 * attempt);
          continue;
        }

        throw new BadRequestException(`No se pudo completar la solicitud a ${providerName}.`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError instanceof BadRequestException
      ? lastError
      : new BadRequestException(`No se pudo completar la solicitud a ${providerName}.`);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildProviderErrorMessage(providerName: string, status: number, errorBody: string) {
    const message = this.tryReadProviderError(errorBody);
    return message
      ? `${providerName} respondio ${status}: ${message}`
      : `${providerName} respondio ${status} al consultar modelos.`;
  }

  private tryReadProviderError(errorBody: string) {
    if (!errorBody) {
      return null;
    }

    try {
      const parsed = JSON.parse(errorBody) as {
        error?: { message?: string; status?: string };
        message?: string;
      };

      return parsed.error?.message ?? parsed.message ?? parsed.error?.status ?? errorBody;
    } catch {
      return errorBody;
    }
  }

  private encryptSecret(value: string) {
    const key = this.getSecretKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  }

  private tryDecryptSecret(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      if (!value.includes(":")) {
        return value;
      }

      const key = this.getSecretKey();
      const [ivHex, encryptedHex] = value.split(":");
      const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final()
      ]);
      return decrypted.toString("utf8");
    } catch {
      return null;
    }
  }

  private getSecretKey() {
    const secret = process.env.JWT_SECRET ?? "change-me-now";
    return createHash("sha256").update(secret).digest();
  }
}
