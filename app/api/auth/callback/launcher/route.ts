import { NextResponse } from "next/server";
import {
  isValidLauncherAuthState,
  saveLauncherAuthToken,
} from "@/lib/launcher-auth-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_REDIRECT_URI =
  "https://laucherfreedrop.shardweb.app/api/auth/callback/launcher";

const HTML_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Content-Type": "text/html; charset=utf-8",
  Expires: "0",
  Pragma: "no-cache",
} as const;

type DiscordTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

function htmlResponse(message: string, status: number = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Launcher OAuth2</title></head><body><main><p>${message}</p></main></body></html>`,
    {
      status,
      headers: HTML_HEADERS,
    }
  );
}

function isDiscordTokenResponse(value: unknown): value is DiscordTokenResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<DiscordTokenResponse>;

  return (
    typeof response.access_token === "string" &&
    typeof response.refresh_token === "string" &&
    typeof response.expires_in === "number" &&
    Number.isFinite(response.expires_in) &&
    response.expires_in > 0
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !isValidLauncherAuthState(state)) {
    return htmlResponse(
      "❌ Não foi possível concluir a autenticação. Feche esta janela e tente novamente.",
      400
    );
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.LAUNCHER_DISCORD_REDIRECT_URI || DEFAULT_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return htmlResponse(
      "❌ Falha na configuração da autenticação. Tente novamente mais tarde.",
      500
    );
  }

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !isDiscordTokenResponse(payload)) {
      return htmlResponse(
        "❌ Falha ao concluir a autenticação. Feche esta janela e tente novamente.",
        502
      );
    }

    saveLauncherAuthToken({
      state,
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn: payload.expires_in,
    });

    return htmlResponse("✅ Autenticação concluída! Volte para o launcher.");
  } catch {
    return htmlResponse(
      "❌ Falha ao concluir a autenticação. Feche esta janela e tente novamente.",
      502
    );
  }
}
