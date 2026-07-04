"use server";

import prisma from "@/lib/prisma";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function resendVerificationAction(email: string): Promise<ActionResult> {
  if (!email) {
    return { success: false, message: "Email address is required." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        success: true,
        message: "If an account exists, a verification email has been sent.",
      };
    }

    if (user.emailVerified) {
      return { success: false, message: "This email is already verified." };
    }

    const verificationToken = await generateEmailVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    };
  } catch (error) {
    console.error("[RESEND_VERIFICATION_ACTION]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
