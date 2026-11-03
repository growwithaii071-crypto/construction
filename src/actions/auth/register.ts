"use server";

import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth";
import { UserRole } from "@/generated/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/notifications";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  RATE_LIMITS,
} from "@/lib/rate-limit";

interface ActionResult {
  success: boolean;
  message: string;
  data?: { email: string };
}

export async function registerAction(formData: unknown): Promise<ActionResult> {
  const parsed = RegisterSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, message: firstError };
  }

  const { name, email, password, phone } = parsed.data;

  const ip = await getClientIp();
  const limited = checkRateLimit(
    `register:ip:${ip}`,
    RATE_LIMITS.registerIp.limit,
    RATE_LIMITS.registerIp.windowMs
  );
  if (!limited.ok) {
    return { success: false, message: rateLimitMessage(limited.retryAfterSec) };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "An account with this email already exists." };
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone ?? null,
        role: UserRole.CLIENT,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    void sendWelcomeEmail(name, email).catch(() => {});

    void notifyAdmins({
      title: "New client registered",
      message: `${name} (${email}) joined as a client.`,
      type: "SUCCESS",
      link: "/clients",
    });

    return {
      success: true,
      message: "Account created successfully! You can now sign in.",
      data: { email },
    };
  } catch (error) {
    console.error("[REGISTER_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
