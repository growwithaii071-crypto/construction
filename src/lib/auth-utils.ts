import { UserRole } from "@/generated/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VIEWER,
  UserRole.CLIENT,
  UserRole.CONTRACTOR,
  UserRole.FOREMAN,
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
 * Optionally checks required role or array of allowed roles.
 */
export async function requireAuth(allowedRoles?: UserRole | UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = session.user.role as UserRole;
    const hasAccess = roles.some((r) => hasRole(userRole, r));
    if (!hasAccess) {
      redirect("/unauthorized");
    }
  }

  return session;
}

export async function getSession() {
  return auth();
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  FOREMAN: "Foreman",
  ACCOUNTANT: "Accountant",
  CLIENT: "Client",
  CONTRACTOR: "Contractor",
  VIEWER: "Viewer",
};

export const SELF_REGISTER_ROLES: UserRole[] = [UserRole.CLIENT];

export const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.VIEWER,
  UserRole.CLIENT,
  UserRole.CONTRACTOR,
  UserRole.FOREMAN,
  UserRole.SITE_ENGINEER,
  UserRole.ACCOUNTANT,
  UserRole.PROJECT_MANAGER,
  UserRole.ADMIN,
];
