import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [total, available, used, recentRedemptions] = await Promise.all([
    prisma.activationKey.count(),
    prisma.activationKey.count({ where: { used: false } }),
    prisma.activationKey.count({ where: { used: true } }),
    prisma.activationKey.findMany({
      where: { used: true },
      orderBy: { usedAt: "desc" },
      take: 10,
      select: { key: true, gameName: true, usedBy: true, usedAt: true },
    }),
  ]);

  const uniqueUsersResult = await prisma.activationKey.findMany({
    where: { used: true, usedBy: { not: null } },
    select: { usedBy: true },
    distinct: ["usedBy"],
  });
  const uniqueUsers = uniqueUsersResult.length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const allKeys = await prisma.activationKey.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, used: true, usedAt: true },
  });

  const chart: { date: string; generated: number; used: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    const generated = allKeys.filter(
      (key) => key.createdAt.toISOString().split("T")[0] === dateStr
    ).length;
    const usedOnDay = allKeys.filter(
      (key) => key.used && key.usedAt && key.usedAt.toISOString().split("T")[0] === dateStr
    ).length;
    chart.push({ date: dateStr, generated, used: usedOnDay });
  }

  return NextResponse.json({
    total,
    available,
    used,
    uniqueUsers,
    recentRedemptions,
    chart,
  });
}
