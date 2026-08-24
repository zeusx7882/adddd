import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getAdminIds } from "@/lib/auth-utils";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const discordId =
      (token?.discordId as string | undefined) ?? (token?.sub as string | undefined);
    const adminIds = getAdminIds();

    if (!discordId || !adminIds.includes(discordId)) {
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
