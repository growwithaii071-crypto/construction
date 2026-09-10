import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";

/** Base roles staff custom roles can map to (not portal CLIENT/CONTRACTOR). */
export const STAFF_BASE_ROLES: UserRole[] = [
  UserRole.VIEWER,
  UserRole.FOREMAN,
  UserRole.SITE_ENGINEER,
  UserRole.ACCOUNTANT,
  UserRole.PROJECT_MANAGER,
  UserRole.ADMIN,
];

export const STAFF_BASE_ROLE_LABELS: Record<string, string> = {
  VIEWER: "Viewer (read-only)",
  FOREMAN: "Foreman",
  SITE_ENGINEER: "Site Engineer",
  ACCOUNTANT: "Accountant",
  PROJECT_MANAGER: "Project Manager",
  ADMIN: "Admin",
};

/** Permission keys available when creating a role */
export const ROLE_PERMISSIONS = [
  { key: "dashboard.view", label: "View dashboard", module: "Dashboard" },
  { key: "projects.view", label: "View projects / jobs", module: "Projects" },
  { key: "projects.manage", label: "Manage projects", module: "Projects" },
  { key: "clients.view", label: "View clients", module: "Clients" },
  { key: "contractors.view", label: "View contractors", module: "Contractors" },
  { key: "users.view", label: "View team users", module: "Users" },
  { key: "users.manage", label: "Create / edit users", module: "Users" },
  { key: "roles.manage", label: "Manage roles", module: "Roles" },
  { key: "finance.view", label: "View finance", module: "Finance" },
  { key: "settings.view", label: "View settings", module: "Settings" },
  { key: "email.manage", label: "Manage email / SMTP", module: "Email" },
] as const;

export type PermissionKey = (typeof ROLE_PERMISSIONS)[number]["key"];

export function permissionLabel(key: string) {
  return ROLE_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}

export function permissionModule(key: string) {
  return ROLE_PERMISSIONS.find((p) => p.key === key)?.module ?? "Other";
}

/** Unique modules assigned from a permission key list */
export function modulesFromPermissions(keys: string[]) {
  const seen = new Set<string>();
  const modules: string[] = [];
  for (const key of keys) {
    const mod = permissionModule(key);
    if (!seen.has(mod)) {
      seen.add(mod);
      modules.push(mod);
    }
  }
  return modules;
}

/** Group ROLE_PERMISSIONS by module for forms */
export function permissionsByModule() {
  const map = new Map<string, { key: string; label: string }[]>();
  for (const p of ROLE_PERMISSIONS) {
    const list = map.get(p.module) ?? [];
    list.push({ key: p.key, label: p.label });
    map.set(p.module, list);
  }
  return Array.from(map.entries()).map(([module, permissions]) => ({
    module,
    permissions,
  }));
}

const DEFAULT_STAFF_ROLES = [
  {
    key: "manager",
    name: "Manager",
    description: "Manages projects, clients and team operations",
    baseRole: UserRole.PROJECT_MANAGER,
    permissions: [
      "dashboard.view",
      "projects.view",
      "projects.manage",
      "clients.view",
      "contractors.view",
      "users.view",
      "finance.view",
    ],
    isSystem: true,
  },
  {
    key: "employee",
    name: "Employee",
    description: "Day-to-day staff with limited access",
    baseRole: UserRole.VIEWER,
    permissions: ["dashboard.view", "projects.view", "clients.view", "contractors.view"],
    isSystem: true,
  },
  {
    key: "site_engineer",
    name: "Site Engineer",
    description: "Field and site engineering access",
    baseRole: UserRole.SITE_ENGINEER,
    permissions: ["dashboard.view", "projects.view", "projects.manage", "clients.view"],
    isSystem: true,
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Invoices, expenses and finance",
    baseRole: UserRole.ACCOUNTANT,
    permissions: ["dashboard.view", "finance.view", "projects.view"],
    isSystem: true,
  },
] as const;

export function slugifyRoleKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export async function ensureDefaultStaffRoles() {
  for (const r of DEFAULT_STAFF_ROLES) {
    await prisma.staffRole.upsert({
      where: { key: r.key },
      create: {
        key: r.key,
        name: r.name,
        description: r.description,
        baseRole: r.baseRole,
        permissions: [...r.permissions],
        isSystem: r.isSystem,
        isActive: true,
      },
      update: {},
    });
  }
}
