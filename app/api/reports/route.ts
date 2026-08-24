import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  if (format === "csv") {
    const keys = await prisma.activationKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    const rows = [
      ["Key", "Game", "App ID", "Used", "Used By", "Used At", "Created At"],
      ...keys.map((key) => [
        key.key,
        key.gameName ?? "",
        key.appId,
        key.used ? "Yes" : "No",
        key.usedBy ?? "",
        key.usedAt ? key.usedAt.toISOString() : "",
        key.createdAt.toISOString(),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="keys-${Date.now()}.csv"`,
      },
    });
  }

  const [topUserResult, topGameResult, usedKeyDays] = await Promise.all([
    prisma.activationKey.groupBy({
      by: ["usedBy"],
      _count: { id: true },
      where: { used: true, usedBy: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.activationKey.groupBy({
      by: ["gameName"],
      _count: { id: true },
      where: { used: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.activationKey.findMany({
      where: { used: true, usedAt: { not: null } },
      select: { usedAt: true },
    }),
  ]);

  const topUser = topUserResult[0];
  const topGame = topGameResult[0];

  const dayCounts = new Map<string, number>();
  for (const key of usedKeyDays) {
    if (key.usedAt) {
      const day = key.usedAt.toISOString().split("T")[0];
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
  }
  const topDays = [...dayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    topUser: topUser ? { discordId: topUser.usedBy!, count: topUser._count.id } : null,
    topGame: topGame ? { name: topGame.gameName ?? "Unknown", count: topGame._count.id } : null,
    topDays,
  });
}
