import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

function isAdmin(session: Session | null) {
  if (!session?.user) return false;
  const user = session.user as { id?: string; discordId?: string };
  return (
    user.discordId === process.env.ADMIN_DISCORD_ID ||
    user.id === process.env.ADMIN_DISCORD_ID
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { keys: true } } },
  });

  return NextResponse.json({ games });
}

const createGameSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  appId: z.string().min(1, "App ID é obrigatório").max(50),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createGameSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, appId } = parsed.data;
  const normalizedAppId = appId.trim();
  const normalizedName = name.trim();

  const existing = await prisma.game.findUnique({
    where: { appId: normalizedAppId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Jogo com este App ID já cadastrado" },
      { status: 409 }
    );
  }

  const game = await prisma.game.create({
    data: { name: normalizedName, appId: normalizedAppId },
  });

  return NextResponse.json({ game }, { status: 201 });
}
