import { NextRequest, NextResponse } from "next/server";
import { checkKey } from "@/lib/api-client";

/**
 * POST /api/keys/check
 * Proxies to the external API's /api/keys/check endpoint.
 * Does NOT consume the key.
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

  const result = await checkKey(key);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 400 });
  }

  return NextResponse.json(result.data);
}
