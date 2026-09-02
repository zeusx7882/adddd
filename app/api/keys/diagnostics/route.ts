import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { getPrismaErrorMessage } from "@/lib/game-api";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/keys/diagnostics
 * Admin-only. Reports aggregate health of the `activation_keys` table
 * (row counts, per-game breakdown, most recent activity) so an admin can
 * confirm keys generated here are actually persisted in the same database
 * the external byzeuskeys API reads from.
 *
 * Never returns DATABASE_URL, tokens, or any other credential.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [total, available, used, latest, byAppId] = await Promise.all([
      prisma.activationKey.count(),
      prisma.activationKey.count({ where: { used: false } }),
      prisma.activationKey.count({ where: { used: true } }),
      prisma.activationKey.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.activationKey.groupBy({
        by: ["appId", "gameName"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      table: "activation_keys",
      totalKeys: total,
      availableKeys: available,
      usedKeys: used,
      byGame: byAppId.map((group) => ({
        appId: group.appId,
        gameName: group.gameName,
        total: group._count.id,
      })),
      lastGeneratedAt: latest?.createdAt ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getPrismaErrorMessage(error, "Erro ao consultar diagnóstico de keys.") },
      { status: 500 }
    );
  }
}
