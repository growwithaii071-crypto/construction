/** Role → home dashboard. Shared by login form + auth middleware. */
export const ROLE_HOME: Record<string, string> = {
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

export function getRoleHome(role?: string | null): string {
  if (!role) return "/dashboard";
  return ROLE_HOME[role] ?? "/dashboard";
}
