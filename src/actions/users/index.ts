"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be 8+ chars"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
});

export async function createUserAction(_prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateUserSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { error: "Email already registered" };

  const hashedPassword = await bcryptjs.hash(d.password, 12);
  try {
    await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        password: hashedPassword,
        role: d.role,
        phone: d.phone,
        isActive: true,
        emailVerified: new Date(),
      },
    });
    revalidatePath("/users");
    redirect("/users");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return { error: msg };
  }
}

export async function toggleUserActiveAction(id: string, isActive: boolean) {
  await requireAuth();
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
}

export async function updateProfileAction(id: string, formData: FormData) {
  await requireAuth();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  await prisma.user.update({ where: { id }, data: { name, phone } });
  revalidatePath("/settings/profile");
  return { success: true };
}

const UpdateUserSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
});

export async function updateUserAction(id: string, _prevState: unknown, formData: FormData) {
  await requireAuth([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateUserSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const conflict = await prisma.user.findFirst({ where: { email: d.email, NOT: { id } } });
  if (conflict) return { error: "Email already in use by another user" };

  try {
    await prisma.user.update({
      where: { id },
      data: { name: d.name, email: d.email, role: d.role, phone: d.phone ?? null },
    });
    revalidatePath("/users");
    redirect("/users");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update user";
    return { error: msg };
  }
}

export async function resetUserPasswordAction(id: string, _prevState: unknown, formData: FormData) {
  await requireAuth([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  const newPassword = formData.get("newPassword") as string;
  if (!newPassword || newPassword.length < 8) return { error: "Password must be 8+ characters" };

  const hash = await bcryptjs.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hash } });
  return { success: true };
}

export async function deleteUserAction(id: string) {
  await requireAuth([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users");
}

export async function changePasswordAction(id: string, formData: FormData) {
  await requireAuth();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found" };

  const valid = await bcryptjs.compare(currentPassword, user.password ?? "");
  if (!valid) return { error: "Current password is incorrect" };

  if (newPassword.length < 8) return { error: "Password must be 8+ characters" };

  const hash = await bcryptjs.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hash } });
  return { success: true };
}
