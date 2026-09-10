"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";

async function requireAdmin() {
  return requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER]);
}

const ClientProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const ContractorProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function updateClientProfileAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  await requireAdmin();

  const parsed = ClientProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findFirst({
    where: { id, role: UserRole.CLIENT },
  });
  if (!user) return { error: "Client not found." };

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  });
  if (emailTaken) return { error: "Email already in use by another account." };

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone?.trim() || null,
        isActive: parsed.data.isActive ?? true,
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}/edit`);
    redirect("/clients");
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to update client" };
  }
}

export async function updateContractorProfileAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  await requireAdmin();

  const parsed = ContractorProfileSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    specialization: formData.get("specialization") || undefined,
    licenseNumber: formData.get("licenseNumber") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findFirst({
    where: { id, role: UserRole.CONTRACTOR },
  });
  if (!user) return { error: "Contractor not found." };

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  });
  if (emailTaken) return { error: "Email already in use by another account." };

  const specializations = (parsed.data.specialization ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let avatarPayload: Record<string, unknown> = {
    companyName: parsed.data.companyName.trim(),
    specialization: specializations,
    licenseNumber: parsed.data.licenseNumber?.trim() || "",
  };

  try {
    if (user.avatar?.startsWith("{")) {
      const prev = JSON.parse(user.avatar) as Record<string, unknown>;
      avatarPayload = { ...prev, ...avatarPayload };
    }
  } catch {
    /* ignore bad JSON */
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: `${parsed.data.name.trim()} — ${parsed.data.companyName.trim()}`,
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone?.trim() || null,
        avatar: JSON.stringify(avatarPayload),
        isActive: parsed.data.isActive ?? true,
      },
    });
    revalidatePath("/contractors");
    revalidatePath(`/contractors/${id}/edit`);
    redirect("/contractors");
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to update contractor" };
  }
}

/** Admin resets password for a portal CLIENT or CONTRACTOR */
export async function resetPortalPasswordAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  await requireAdmin();

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      role: { in: [UserRole.CLIENT, UserRole.CONTRACTOR] },
    },
  });
  if (!user) return { error: "Account not found." };

  const hash = await bcryptjs.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hash } });

  if (user.role === UserRole.CLIENT) {
    revalidatePath(`/clients/${id}/edit`);
  } else {
    revalidatePath(`/contractors/${id}/edit`);
  }

  return { success: true as const, message: "Password updated successfully." };
}
