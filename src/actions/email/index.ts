"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { testSmtpConnection, sendTemplateEmail } from "@/lib/email";
import { ensureDefaultEmailTemplates } from "@/lib/email-templates";
import { z } from "zod";

async function requireAdmin() {
  return requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

const SmtpSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Valid from email required"),
  fromName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function saveSmtpSettingsAction(formData: FormData) {
  await requireAdmin();

  const parsed = SmtpSchema.safeParse({
    host: formData.get("host"),
    port: formData.get("port"),
    secure: formData.get("secure") === "on" || formData.get("secure") === "true",
    username: formData.get("username"),
    password: formData.get("password"),
    fromEmail: formData.get("fromEmail"),
    fromName: formData.get("fromName") || undefined,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const existing = await prisma.smtpSettings.findFirst({ orderBy: { updatedAt: "desc" } });

    if (existing) {
      const password =
        parsed.data.password === "••••••••" ? existing.password : parsed.data.password;
      await prisma.smtpSettings.update({
        where: { id: existing.id },
        data: {
          host: parsed.data.host,
          port: parsed.data.port,
          secure: parsed.data.secure ?? false,
          username: parsed.data.username,
          password,
          fromEmail: parsed.data.fromEmail,
          fromName: parsed.data.fromName ?? null,
          isActive: true,
        },
      });
    } else {
      // Don't persist the masked placeholder as a real password
      let password = parsed.data.password;
      if (password === "••••••••") {
        const envPass = process.env.EMAIL_SERVER_PASSWORD || "";
        if (!envPass) {
          return {
            success: false as const,
            message: "Enter the real SMTP password before saving.",
          };
        }
        password = envPass;
      }
      await prisma.smtpSettings.create({
        data: {
          host: parsed.data.host,
          port: parsed.data.port,
          secure: parsed.data.secure ?? false,
          username: parsed.data.username,
          password,
          fromEmail: parsed.data.fromEmail,
          fromName: parsed.data.fromName ?? "BuildPro",
          isActive: true,
        },
      });
    }

    revalidatePath("/settings/email");
    return { success: true as const, message: "SMTP settings saved to database." };
  } catch (err) {
    console.error("[SAVE_SMTP]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Failed to save SMTP settings.",
    };
  }
}

export async function testSmtpAction() {
  await requireAdmin();
  return testSmtpConnection();
}

export async function sendTestEmailAction(to: string) {
  await requireAdmin();
  if (!to.includes("@")) return { success: false as const, message: "Enter a valid email." };

  const result = await sendTemplateEmail("welcome", to, {
    userName: "Admin",
    userEmail: to,
  });

  return result.success
    ? { success: true as const, message: `Test email sent to ${to}` }
    : { success: false as const, message: "Failed to send. Check SMTP settings." };
}

export async function updateEmailTemplateAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("bodyHtml") ?? "").trim();
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!id || !subject || !bodyHtml) {
    return { success: false as const, message: "Subject and body are required." };
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: { subject, bodyHtml, isActive },
  });

  revalidatePath("/settings/email-templates");
  return { success: true as const, message: "Template updated." };
}

export async function seedEmailTemplatesAction() {
  await requireAdmin();
  await ensureDefaultEmailTemplates();
  revalidatePath("/settings/email-templates");
}
