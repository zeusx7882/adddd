import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { getPrismaErrorMessage, optionalImageUrlSchema } from "@/lib/game-api";
import { prisma } from "@/lib/prisma";

const updateGameSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100).optional(),
  appId: z
    .string()
    .trim()
    .min(1)
    .regex(/^\d+$/, "App ID deve ser numérico")
    .max(50)
    .optional(),
  imageUrl: optionalImageUrlSchema,
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    if (
      parsed.data.name === undefined &&
      parsed.data.appId === undefined &&
      parsed.data.imageUrl === undefined
    ) {
      return NextResponse.json(
        { error: "Informe ao menos um campo para atualizar." },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    if (parsed.data.appId && parsed.data.appId !== game.appId) {
      const conflict = await prisma.game.findUnique({ where: { appId: parsed.data.appId } });
      if (conflict) {
        return NextResponse.json({ error: "App ID já existe" }, { status: 409 });
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        name: parsed.data.name ?? game.name,
        appId: parsed.data.appId ?? game.appId,
        imageUrl:
          parsed.data.imageUrl !== undefined ? (parsed.data.imageUrl || null) : game.imageUrl,
      },
    });

    return NextResponse.json({ game: updated, message: "Jogo atualizado com sucesso." });
  } catch (error) {
    return NextResponse.json(
      { error: getPrismaErrorMessage(error, "Erro ao atualizar jogo.") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    await prisma.game.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Jogo deletado com sucesso." });
  } catch (error) {
    return NextResponse.json(
      { error: getPrismaErrorMessage(error, "Erro ao deletar jogo.") },
      { status: 500 }
    );
  }
}
