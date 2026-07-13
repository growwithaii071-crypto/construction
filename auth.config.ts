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

      const AUTH_ROUTES = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/customer/login",
        "/customer/register",
        "/construction/login",
        "/construction/register",
      ];
      const CONTRACTOR_ROUTES = ["/construction/dashboard", "/construction/services", "/construction/requests"];
      const CUSTOMER_ROUTES = ["/customer/dashboard", "/customer/services"];
      const PUBLIC_ROUTES = ["/", "/unauthorized", ...AUTH_ROUTES];

      const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
      const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
      const isContractorRoute = CONTRACTOR_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
      const isCustomerRoute = CUSTOMER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

      if (isLoggedIn && isAuthRoute) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        const dest =
          role === "CLIENT"
            ? "/customer/dashboard"
            : role === "CONTRACTOR"
              ? "/construction/dashboard"
              : "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }
      if (isPublic) return true;
      if (!isLoggedIn) {
        if (isContractorRoute) return Response.redirect(new URL("/construction/login", nextUrl));
        if (isCustomerRoute) return Response.redirect(new URL("/customer/login", nextUrl));
        return false;
      }

      return true;
    },
  },
};
