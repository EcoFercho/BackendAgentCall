import { BadRequestException, Injectable } from "@nestjs/common";
import { LlmProviderType } from "@prisma/client";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ListLlmModelsDto } from "./presentation/http/dto/list-llm-models.dto";
import { REMOTE_LLM_PROVIDERS, RemoteLlmProvider, SaveLlmConfigDto } from "./presentation/http/dto/save-llm-config.dto";

const DEFAULT_CONFIG_KEY = "default";
const DEFAULT_LLM_REFERENCE_MARKDOWN = `{{ 'Eres un analista senior de incidentes SOC y NOC. Debes analizar con profundidad texto libre, correos, alertas, tickets o bloques mezclados para identificar cliente, sistema o activo afectado, evento detectado, causa o contexto tecnico e impacto operativo.

Haz el analisis completo internamente, pero devuelve SOLO el resultado final en este formato exacto:

RESUMEN TECNICO DEL INCIDENTE

<un solo parrafo>

Reglas obligatorias:
1. Devuelve solo esa seccion final, sin encabezados adicionales, sin listas, sin tablas y sin texto extra.
2. El parrafo debe empezar siempre con el nombre del cliente. Si no se puede identificar, empieza con No especificado.
3. Longitud minima 180 caracteres y maxima 500 caracteres.
4. El parrafo debe sonar humano, natural y profesional, no robotico ni telegrafico.
5. Debe ser lo bastante explicito para que un ingeniero junior entienda el incidente sin revisar el texto original y sin tener que suponer datos clave.
6. Debe mencionar de forma clara y directa: que paso, sobre que activo o sistema ocurrio, cual fue la causa o evento detectado y cual es el impacto o riesgo operativo.
7. Si alguno de esos elementos no aparece, no lo inventes; redacta el resumen con lo que si este soportado por el texto.
8. Evita frases cortadas, listas de palabras o estructuras repetitivas de plantilla.
9. Si el cliente aparece como ciudad, empresa, sitio, sucursal o entidad comercial, usalo como cliente.
10. Ignora pies de pagina, enlaces, firmas y textos comerciales.
11. Si el incidente menciona NOC, AP leave, desconexion, hardware, fallo fisico, enlace o disponibilidad, interpretalo como infraestructura. Si menciona malware, C2, exfiltracion, VPN sospechosa o actividad maliciosa, interpretalo como seguridad.
12. Aunque solo respondas con el resumen, analiza a profundidad antes de redactarlo.

Criterios de extraccion internos:
- Cliente puede venir como nombre de empresa, ciudad, sitio, sucursal, tenant o referencia comercial.
- Si aparece una fecha completa como 2026-04-30 14:45:02, usala para comprender el momento del evento.
- Si el objeto contiene Physical AP leave o texto equivalente, interpretalo como desconexion fisica de punto de acceso o evento similar.
- Si la afectacion dice Equipo desconectado del fortiGate, refleja interrupcion de servicio, perdida de conectividad o afectacion del acceso solo si el texto lo justifica.

Texto del usuario:
' + $json.userText + '

Respuesta:' }}`;
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

  private mapConfig(
    config:
      | {
          id: string;
          activeProvider: LlmProviderType;
          localBaseUrl: string;
          localGeneratePath: string;
          localModel: string;
          localTimeoutMs: number;
          apiProviderName: string | null;
          apiBaseUrl: string | null;
          apiGeneratePath: string | null;
          apiModel: string | null;
          apiKey: string | null;
          apiTimeoutMs: number;
          referenceMarkdown: string;
          updatedAt: Date;
        }
      | null
  ) {
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
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
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

  private async fetchProviderJson<T>(
    providerName: RemoteLlmProvider,
    url: string,
    options?: {
      headers?: Record<string, string>;
    }
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: options?.headers,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new BadRequestException(
          this.buildProviderErrorMessage(providerName, response.status, errorBody)
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new BadRequestException(`La consulta de modelos para ${providerName} excedio el tiempo limite.`);
      }

      throw new BadRequestException(`No se pudieron obtener modelos desde ${providerName}.`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildProviderErrorMessage(providerName: RemoteLlmProvider, status: number, errorBody: string) {
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
