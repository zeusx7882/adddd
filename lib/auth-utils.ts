import type { Session } from "next-auth";

export function getAdminIds(): string[] {
  const multi = process.env.ADMIN_DISCORD_IDS;
  const single = process.env.ADMIN_DISCORD_ID;
  const raw = multi ?? single ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  const user = session.user as { id?: string; discordId?: string };
  const ids = getAdminIds();
  if (ids.length === 0) return false;
  return ids.includes(user.discordId ?? "") || ids.includes(user.id ?? "");
}
