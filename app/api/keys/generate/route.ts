import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import crypto from "crypto";
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

function generateKey(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase();
  const part1 = crypto.randomBytes(4).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${cleanPrefix}-${part1}-${part2}`;
}

const generateSchema = z.object({
  gameId: z.string().min(1, "ID do jogo é obrigatório"),
  quantity: z
    .number()
    .int("Quantidade deve ser um inteiro")
    .min(1, "Mínimo 1 key")
    .max(100, "Máximo 100 keys"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { gameId, quantity } = parsed.data;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  }

  const generatedKeys: string[] = [];
  const maxAttempts = quantity * 3;
  let attempts = 0;

  while (generatedKeys.length < quantity && attempts < maxAttempts) {
    attempts++;
    const candidate = generateKey(game.name);
    const exists = await prisma.key.findUnique({ where: { key: candidate } });
    if (!exists) {
      generatedKeys.push(candidate);
    }
  }

  if (generatedKeys.length === 0) {
    return NextResponse.json(
      { error: "Não foi possível gerar keys únicas. Tente novamente." },
      { status: 500 }
    );
  }

  await prisma.key.createMany({
    data: generatedKeys.map((key) => ({ key, gameId: game.id })),
  });

  return NextResponse.json({
    success: true,
    generated: generatedKeys.length,
    keys: generatedKeys,
  });
}
