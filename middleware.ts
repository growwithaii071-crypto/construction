import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { UserRole } from "@/generated/prisma";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/unauthorized",
];

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const ROLE_ROUTES: Record<string, UserRole> = {
  "/admin": UserRole.ADMIN,
  "/settings/users": UserRole.ADMIN,
};

const ROLE_HIERARCHY: UserRole[] = [
  UserRole.CLIENT,
  UserRole.CONTRACTOR,
  UserRole.SITE_ENGINEER,
  UserRole.ACCOUNTANT,
  UserRole.PROJECT_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && matchesRoute(pathname, AUTH_ROUTES)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle expired refresh token errors
  if (
    session.error === "RefreshTokenExpired" ||
    session.error === "RefreshTokenError"
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "SessionExpired");
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  for (const [route, requiredRole] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
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
