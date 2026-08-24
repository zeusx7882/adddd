import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const key = await prisma.activationKey.findUnique({ where: { id } });
  if (!key) {
    return NextResponse.json({ error: "Key não encontrada" }, { status: 404 });
  }

  await prisma.activationKey.delete({ where: { id } });

  const user = session.user as { id?: string; discordId?: string };
  await prisma.auditLog.create({
    data: {
      action: "DELETE_KEY",
      details: `Deleted key "${key.key}" (game: ${key.gameName ?? key.appId})`,
      adminId: user.discordId ?? user.id ?? "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
