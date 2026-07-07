import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// Define roles as plain strings to avoid Prisma WASM import in Edge runtime
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

const ROLE_ROUTES: Record<string, UserRole> = {
  "/admin": "ADMIN",
  "/settings/users": "ADMIN",
};

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

  if (session?.error === "RefreshTokenExpired" || session?.error === "RefreshTokenError") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "SessionExpired");
    return NextResponse.redirect(loginUrl);
  }

  for (const [route, requiredRole] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route) && session?.user) {
      const userRole = session.user.role as UserRole;
      if (!hasRole(userRole, requiredRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
