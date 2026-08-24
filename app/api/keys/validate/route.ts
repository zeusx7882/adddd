import { NextRequest, NextResponse } from "next/server";
import { validateKey } from "@/lib/api-client";

/**
 * POST /api/keys/validate
 * Proxies to the external API's /api/keys/validate endpoint.
 * CONSUMES the key — only call when the action genuinely requires it.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const key = typeof (body as Record<string, unknown>).key === "string"
    ? ((body as Record<string, string>).key as string)
    : "";

  const result = await validateKey(key);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status > 0 ? result.status : 502 });
  }

  return NextResponse.json(result.data);
}
