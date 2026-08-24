import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "ACCOUNTANT"
  | "FOREMAN"
  | "CONTRACTOR"
  | "CLIENT"
  | "VIEWER";

// Staff-only routes (require ADMIN or higher)
const ADMIN_ONLY_ROUTES = ["/admin", "/settings/users"];

const ROLE_HIERARCHY: UserRole[] = [
  "VIEWER",
  "CLIENT",
  "CONTRACTOR",
  "FOREMAN",
  "SITE_ENGINEER",
  "ACCOUNTANT",
  "PROJECT_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextAuthRequest) {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Handle expired refresh token — force re-login
  if (
    session?.error === "RefreshTokenExpired" ||
    session?.error === "RefreshTokenError"
  ) {
    const role = (session?.user as { role?: string } | undefined)?.role;
    let loginUrl: URL;
    if (role === "CLIENT") {
      loginUrl = new URL("/customer/login", req.url);
    } else if (role === "CONTRACTOR") {
      loginUrl = new URL("/construction/login", req.url);
    } else {
      loginUrl = new URL("/login", req.url);
    }
    loginUrl.searchParams.set("error", "SessionExpired");
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only route enforcement
  for (const route of ADMIN_ONLY_ROUTES) {
    if (pathname.startsWith(route) && session?.user) {
      const userRole = (session.user as { role?: string }).role as UserRole;
      if (!hasRole(userRole, "ADMIN")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
