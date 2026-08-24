import { existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    buildReady: existsSync(path.join(process.cwd(), ".next", "BUILD_ID")),
  });
}
