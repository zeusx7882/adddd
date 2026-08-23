import type { Session } from "next-auth";

/**
 * Returns true if the session belongs to the authorized admin Discord ID.
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  const user = session.user as { id?: string; discordId?: string };
  const adminId = process.env.ADMIN_DISCORD_ID;
  return !!adminId && (user.discordId === adminId || user.id === adminId);
}
