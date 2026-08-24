import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config used by middleware.
 * Must NOT import any Node.js-only modules (crypto, prisma, bcryptjs, etc.)
 */

// Routes that anyone can visit without logging in
const PUBLIC_ROUTES = ["/", "/unauthorized"];

// Routes that only non-logged-in users should see (login/register pages)
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

// After login, redirect each role to their home
const ROLE_HOME: Record<string, string> = {
  CLIENT: "/customer/dashboard",
  CONTRACTOR: "/construction/dashboard",
  ADMIN: "/dashboard",
  SUPER_ADMIN: "/dashboard",
  PROJECT_MANAGER: "/dashboard",
  SITE_ENGINEER: "/dashboard",
  ACCOUNTANT: "/dashboard",
  FOREMAN: "/dashboard",
  VIEWER: "/dashboard",
};

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
      const role = ((auth?.user as { role?: string } | undefined)?.role ?? "") as string;
      const pathname = nextUrl.pathname;

      const isPublic = PUBLIC_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );
      const isAuthRoute = AUTH_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );

      const isContractorArea = pathname.startsWith("/construction/");
      const isCustomerArea = pathname.startsWith("/customer/");
      const isAdminArea = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

      // ── Logged-in user hitting a login/register page → redirect to their dashboard ──
      if (isLoggedIn && isAuthRoute) {
        const dest = ROLE_HOME[role] ?? "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      // ── Public pages are always accessible ──
      if (isPublic) return true;

      // ── Not logged in → redirect to the correct login page ──
      if (!isLoggedIn) {
        if (isContractorArea) return Response.redirect(new URL("/construction/login", nextUrl));
        if (isCustomerArea) return Response.redirect(new URL("/customer/login", nextUrl));
        return Response.redirect(new URL("/login", nextUrl));
      }

      // ── Logged in — enforce role boundaries ──

      // Contractor area: only CONTRACTOR role allowed
      if (isContractorArea) {
        if (role === "CONTRACTOR") return true;
        // Wrong role — send them to their correct portal
        const dest = ROLE_HOME[role] ?? "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      // Customer area: only CLIENT role allowed
      if (isCustomerArea) {
        if (role === "CLIENT") return true;
        const dest = ROLE_HOME[role] ?? "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      // Admin/staff area: block CLIENT and CONTRACTOR
      if (isAdminArea) {
        if (role === "CLIENT") return Response.redirect(new URL("/customer/dashboard", nextUrl));
        if (role === "CONTRACTOR") return Response.redirect(new URL("/construction/dashboard", nextUrl));
        return true;
      }

      return true;
    },
  },
};
