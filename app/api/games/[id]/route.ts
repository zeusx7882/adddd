import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const updateGameSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  appId: z
    .string()
    .min(1)
    .regex(/^\d+$/, "App ID deve ser numérico")
    .max(50)
    .optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  return NextResponse.json({ game: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  return NextResponse.json({ success: true });
}
