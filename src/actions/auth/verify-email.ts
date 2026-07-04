"use server";

import prisma from "@/lib/prisma";
import {
  getEmailVerificationToken,
  deleteEmailVerificationToken,
} from "@/lib/tokens";
import { sendWelcomeEmail } from "@/lib/email";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) {
    return { success: false, message: "Verification token is missing." };
  }

  try {
    const verificationToken = await getEmailVerificationToken(token);

    if (!verificationToken) {
      return { success: false, message: "Invalid or expired verification link." };
    }

    if (verificationToken.expires < new Date()) {
      await deleteEmailVerificationToken(token);
      return {
        success: false,
        message: "This verification link has expired. Please register again.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      return { success: false, message: "Account not found." };
    }

    if (user.emailVerified) {
      await deleteEmailVerificationToken(token);
      return { success: true, message: "Your email is already verified. You can log in." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await deleteEmailVerificationToken(token);
    await sendWelcomeEmail(user.name, user.email);

    return {
      success: true,
      message: "Email verified successfully! Your account is now active.",
    };
  } catch (error) {
    console.error("[VERIFY_EMAIL_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
