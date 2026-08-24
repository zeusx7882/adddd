/**
 * Centralized HTTP client for the external keys API.
 * Base URL is configured via NEXT_PUBLIC_API_BASE_URL (public, no secrets).
 */

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "https://byzeuskeys.shardweb.app";

const TIMEOUT_MS = 10_000;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

/** Friendly message map for well-known HTTP status codes. */
function friendlyMessage(status: number, fallback?: string): string {
  if (status === 400) return fallback ?? "Key inválida ou já utilizada.";
  if (status === 404) return "Key não encontrada.";
  if (status === 500) return "Ocorreu um erro no servidor. Tente novamente.";
  return fallback ?? `Erro inesperado (${status}).`;
}

async function callApi<T>(
  path: string,
  body: Record<string, string>
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    const payload = json as Record<string, unknown>;

    if (!res.ok) {
      const serverMsg =
        typeof payload.message === "string" ? payload.message :
        typeof payload.error === "string" ? payload.error :
        undefined;
      return {
        ok: false,
        status: res.status,
        message: friendlyMessage(res.status, serverMsg),
      };
    }

    return { ok: true, data: payload as T };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        message: "Não foi possível conectar à API. Tente novamente.",
      };
    }
    return {
      ok: false,
      status: 0,
      message: "Não foi possível conectar à API. Tente novamente.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface CheckResult {
  valid: boolean;
  message?: string;
  game?: { name: string; appId: string };
}

export interface ValidateResult {
  valid: boolean;
  message?: string;
  game?: { name: string; appId: string };
}

/**
 * Consult a key WITHOUT consuming it.
 * Maps to POST /api/keys/check on the external API.
 */
export async function checkKey(key: string): Promise<ApiResult<CheckResult>> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { ok: false, status: 400, message: "Digite uma key válida." };
  }
  return callApi<CheckResult>("/api/keys/check", { key: trimmed });
}

/**
 * Validate AND consume a key.
 * Maps to POST /api/keys/validate on the external API.
 * Only call this when the action genuinely intends to consume the key.
 */
export async function validateKey(key: string): Promise<ApiResult<ValidateResult>> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { ok: false, status: 400, message: "Digite uma key válida." };
  }
  return callApi<ValidateResult>("/api/keys/validate", { key: trimmed });
}
