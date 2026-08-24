import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { getPrismaErrorMessage, optionalImageUrlSchema } from "@/lib/game-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      orderBy: { createdAt: "desc" },
    });

    const keyCounts = await prisma.activationKey.groupBy({
      by: ["appId", "used"],
      _count: { id: true },
    });

    const availableMap = new Map(
      keyCounts
        .filter((keyCount) => !keyCount.used)
        .map((keyCount) => [keyCount.appId, keyCount._count.id])
    );
    const usedMap = new Map(
      keyCounts
        .filter((keyCount) => keyCount.used)
        .map((keyCount) => [keyCount.appId, keyCount._count.id])
    );

    const gamesWithCounts = games.map((game) => ({
      ...game,
      _count: {
        available: availableMap.get(game.appId) ?? 0,
        used: usedMap.get(game.appId) ?? 0,
        total: (availableMap.get(game.appId) ?? 0) + (usedMap.get(game.appId) ?? 0),
      },
    }));

    return NextResponse.json({ games: gamesWithCounts });
  } catch (error) {
    return NextResponse.json(
      { error: getPrismaErrorMessage(error, "Erro ao carregar jogos.") },
      { status: 500 }
    );
  }
}

const createGameSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  appId: z
    .string()
    .trim()
    .min(1, "App ID é obrigatório")
    .regex(/^\d+$/, "App ID deve ser numérico")
    .max(50),
  imageUrl: optionalImageUrlSchema,
});

export async function POST(req: NextRequest) {
  try {
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

    const { name, appId, imageUrl } = parsed.data;

    const existing = await prisma.game.findUnique({ where: { appId } });
    if (existing) {
      return NextResponse.json({ error: "Jogo com este App ID já cadastrado" }, { status: 409 });
    }

    const game = await prisma.game.create({
      data: { name, appId, imageUrl: imageUrl || null },
    });

    return NextResponse.json({ game, message: "Jogo cadastrado com sucesso." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getPrismaErrorMessage(error, "Erro ao cadastrar jogo.") },
      { status: 500 }
    );
  }
}
