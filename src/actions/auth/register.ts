"use server";

import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth";
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
