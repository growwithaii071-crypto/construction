import { UserRole } from "@/generated/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.CLIENT,
  UserRole.CONTRACTOR,
  UserRole.SITE_ENGINEER,
  UserRole.ACCOUNTANT,
  UserRole.PROJECT_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

export function isAdmin(role: UserRole): boolean {
  return hasRole(role, UserRole.ADMIN);
}

export function isProjectManager(role: UserRole): boolean {
  return hasRole(role, UserRole.PROJECT_MANAGER);
}

/**
 * Server-side session guard. Redirects to /login if not authenticated.
 * Optionally checks required role.
 */
export async function requireAuth(requiredRole?: UserRole) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Returns the current session or null (no redirect).
 */
export async function getSession() {
  return auth();
}

/**
 * Role display labels
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  ACCOUNTANT: "Accountant",
  CLIENT: "Client",
  CONTRACTOR: "Contractor",
};

/**
 * Roles that can be self-registered
 */
export const SELF_REGISTER_ROLES: UserRole[] = [UserRole.CLIENT];

/**
 * Admin-assignable roles
 */
export const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.CLIENT,
  UserRole.CONTRACTOR,
  UserRole.SITE_ENGINEER,
  UserRole.ACCOUNTANT,
  UserRole.PROJECT_MANAGER,
  UserRole.ADMIN,
];
