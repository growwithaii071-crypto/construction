import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config used by middleware.
 * Must NOT import any Node.js-only modules (crypto, prisma, bcryptjs, etc.)
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
      const PUBLIC_ROUTES = ["/", "/unauthorized", ...AUTH_ROUTES];

      const isPublic = PUBLIC_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );
      const isAuthRoute = AUTH_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );

      if (isLoggedIn && isAuthRoute) return Response.redirect(new URL("/dashboard", nextUrl));
      if (isPublic) return true;
      if (!isLoggedIn) return false;

      return true;
    },
  },
};
