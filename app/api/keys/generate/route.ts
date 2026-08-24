import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(adminId: string): boolean {
  const now = Date.now();

  for (const [key, value] of rateLimiter.entries()) {
    if (now > value.resetAt) {
      rateLimiter.delete(key);
    }
  }

  const entry = rateLimiter.get(adminId);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(adminId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

function generateKey(gameName: string): string {
  const word =
    gameName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase() || "KEY";
  const part1 = crypto.randomBytes(4).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${word}-${part1}-${part2}`;
}

const generateSchema = z.object({
  gameId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = session.user as { id?: string; discordId?: string };
  const adminId = user.discordId ?? user.id ?? "unknown";

  if (!checkRateLimit(adminId)) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde 1 minuto." },
      { status: 429 }
    );
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

  const extra = Math.ceil(quantity * 0.5);
  const candidates = Array.from({ length: quantity + extra }, () => generateKey(game.name));

  const existingKeys = await prisma.activationKey.findMany({
    where: { key: { in: candidates } },
    select: { key: true },
  });
  const existingSet = new Set(existingKeys.map((key) => key.key));

  const uniqueCandidates = [...new Set(candidates)].filter((key) => !existingSet.has(key));
  const toCreate = uniqueCandidates.slice(0, quantity);

  if (toCreate.length === 0) {
    return NextResponse.json(
      { error: "Não foi possível gerar keys únicas. Tente novamente." },
      { status: 500 }
    );
  }

  await prisma.activationKey.createMany({
    data: toCreate.map((key) => ({ key, appId: game.appId, gameName: game.name })),
  });

  await prisma.auditLog.create({
    data: {
      action: "GENERATE_KEYS",
      details: `Generated ${toCreate.length} keys for game "${game.name}" (appId: ${game.appId})`,
      adminId,
    },
  });

  return NextResponse.json({ success: true, generated: toCreate.length, keys: toCreate });
}
