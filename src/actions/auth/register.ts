"use server";

import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { UserRole } from "@/generated/prisma";

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

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "An account with this email already exists." };
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone ?? null,
        role: UserRole.CLIENT,
        isActive: true,
        emailVerified: null,
      },
    });

    // Send verification email
    const verificationToken = await generateEmailVerificationToken(user.email);
    await sendVerificationEmail(user.email, verificationToken.token);

    return {
      success: true,
      message: "Account created! Please check your email to verify your account.",
      data: { email: user.email },
    };
  } catch (error) {
    console.error("[REGISTER_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
