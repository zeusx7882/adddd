import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const discordProfile = profile as {
        id: string;
        username: string;
        avatar?: string;
      } | undefined;

      if (!discordProfile || discordProfile.id !== process.env.ADMIN_DISCORD_ID) {
        return false;
      }

      await prisma.admin.upsert({
        where: { discordId: discordProfile.id },
        update: {
          discordUsername: discordProfile.username,
          discordAvatar: discordProfile.avatar
            ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
            : null,
        },
        create: {
          discordId: discordProfile.id,
          discordUsername: discordProfile.username,
          discordAvatar: discordProfile.avatar
            ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
            : null,
        },
      });

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.discordId = token.discordId as string | undefined;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const discordProfile = profile as { id: string };
        token.discordId = discordProfile.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
