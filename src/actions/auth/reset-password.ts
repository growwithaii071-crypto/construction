"use server";

import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { ResetPasswordSchema } from "@/schemas/auth";
import {
  getPasswordResetToken,
  deletePasswordResetToken,
  revokeAllUserRefreshTokens,
} from "@/lib/tokens";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function resetPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, message: firstError };
  }

  const { token, password } = parsed.data;

  try {
    const resetToken = await getPasswordResetToken(token);

    if (!resetToken) {
      return { success: false, message: "Invalid or expired reset link." };
    }

    if (resetToken.expires < new Date()) {
      await deletePasswordResetToken(token);
      return { success: false, message: "This reset link has expired. Please request a new one." };
    }

    const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
      return { success: false, message: "Account not found." };
    }

    const hashedPassword = await hash(password, 12);

    // Update password and revoke all existing sessions
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await revokeAllUserRefreshTokens(user.id);
    await deletePasswordResetToken(token);

    return {
      success: true,
      message: "Password updated successfully. Please log in with your new password.",
    };
  } catch (error) {
    console.error("[RESET_PASSWORD_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
