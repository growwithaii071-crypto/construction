"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import {
  STAFF_BASE_ROLES,
  ensureDefaultStaffRoles,
  slugifyRoleKey,
} from "@/lib/staff-roles";

async function requireRoleAdmin() {
  return requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

const RoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  baseRole: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
});

export async function createStaffRoleAction(_prev: unknown, formData: FormData) {
  await requireRoleAdmin();
  await ensureDefaultStaffRoles();

  const permissions = formData.getAll("permissions").map(String);
  const parsed = RoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    baseRole: formData.get("baseRole"),
    permissions,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!STAFF_BASE_ROLES.includes(parsed.data.baseRole)) {
    return { error: "Invalid access level for a staff role." };
  }

  let key = slugifyRoleKey(parsed.data.name);
  if (!key) return { error: "Invalid role name." };

  const existingKey = await prisma.staffRole.findUnique({ where: { key } });
  if (existingKey) {
    key = `${key}_${Date.now().toString(36).slice(-4)}`;
  }

  try {
    await prisma.staffRole.create({
      data: {
        name: parsed.data.name.trim(),
        key,
        description: parsed.data.description?.trim() || null,
        baseRole: parsed.data.baseRole,
        permissions: parsed.data.permissions,
        isActive: true,
        isSystem: false,
      },
    });
    revalidatePath("/roles");
    revalidatePath("/users/new");
    redirect("/roles");
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to create role" };
  }
}

export async function updateStaffRoleAction(id: string, _prev: unknown, formData: FormData) {
  await requireRoleAdmin();

  const permissions = formData.getAll("permissions").map(String);
  const parsed = RoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    baseRole: formData.get("baseRole"),
    permissions,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!STAFF_BASE_ROLES.includes(parsed.data.baseRole)) {
    return { error: "Invalid access level for a staff role." };
  }

  const role = await prisma.staffRole.findUnique({ where: { id } });
  if (!role) return { error: "Role not found." };

  try {
    await prisma.staffRole.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        baseRole: parsed.data.baseRole,
        permissions: parsed.data.permissions,
        isActive: parsed.data.isActive ?? true,
      },
    });

    // Keep assigned users' system role in sync with new baseRole
    await prisma.user.updateMany({
      where: { staffRoleId: id },
      data: { role: parsed.data.baseRole },
    });

    revalidatePath("/roles");
    revalidatePath("/users");
    revalidatePath(`/roles/${id}/edit`);
    redirect("/roles");
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to update role" };
  }
}

export async function toggleStaffRoleAction(id: string, isActive: boolean) {
  await requireRoleAdmin();
  const role = await prisma.staffRole.findUnique({ where: { id } });
  if (!role) return { error: "Role not found." };
  if (role.isSystem && !isActive) {
    return { error: "System roles cannot be disabled." };
  }
  await prisma.staffRole.update({ where: { id }, data: { isActive } });
  revalidatePath("/roles");
  revalidatePath("/users/new");
  return { success: true };
}

export async function deleteStaffRoleAction(id: string) {
  await requireRoleAdmin();
  const role = await prisma.staffRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return { error: "Role not found." };
  if (role.isSystem) return { error: "System roles cannot be deleted." };
  if (role._count.users > 0) {
    return { error: "Remove or reassign users before deleting this role." };
  }
  await prisma.staffRole.delete({ where: { id } });
  revalidatePath("/roles");
  redirect("/roles");
}
