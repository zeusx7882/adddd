import { NextResponse } from "next/server";
import {
  consumeLauncherAuthRecord,
  isValidLauncherAuthState,
} from "@/lib/launcher-auth-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Expires: "0",
  Pragma: "no-cache",
} as const;

export async function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state");

  if (!state || !isValidLauncherAuthState(state)) {
    return NextResponse.json({ error: "State inválido." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const record = consumeLauncherAuthRecord(state);
  if (!record) {
    return NextResponse.json({ status: "pending" }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    {
      status: "completed",
      token: {
        accessToken: record.accessToken,
        refreshToken: record.refreshToken,
        expiresIn: record.expiresIn,
      },
    },
    { headers: NO_STORE_HEADERS }
  );
}
