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
  const filter = searchParams.get("filter") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const where = {
    ...(filter === "available"
      ? { used: false }
      : filter === "used"
        ? { used: true }
        : {}),
    ...(search
      ? {
          OR: [
            { key: { contains: search, mode: "insensitive" as const } },
            { gameName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [keys, total] = await Promise.all([
    prisma.activationKey.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activationKey.count({ where }),
  ]);

  return NextResponse.json({ keys, total, page, pages: Math.ceil(total / limit) });
}
