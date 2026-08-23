import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const discordId =
      (token?.discordId as string | undefined) ?? (token?.sub as string | undefined);

    if (discordId !== process.env.ADMIN_DISCORD_ID) {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/games/:path*", "/api/keys/:path*"],
};
