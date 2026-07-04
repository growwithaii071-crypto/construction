"use server";

import prisma from "@/lib/prisma";
import { ForgotPasswordSchema } from "@/schemas/auth";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function forgotPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(formData);

  if (!parsed.success) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      };
    }

    const resetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(email, resetToken.token);

    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
