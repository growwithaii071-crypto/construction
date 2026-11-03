"use server";

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas/auth";
import { AuthError } from "next-auth";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  RATE_LIMITS,
} from "@/lib/rate-limit";

interface ActionResult {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export async function loginAction(formData: unknown, callbackUrl?: string): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, message: firstError };
  }

  const { email, password } = parsed.data;
  const redirectTo = callbackUrl ?? "/dashboard";

  const ip = await getClientIp();
  const emailKey = email.trim().toLowerCase();
  const ipLimit = checkRateLimit(
    `login:ip:${ip}`,
    RATE_LIMITS.loginIp.limit,
    RATE_LIMITS.loginIp.windowMs
  );
  if (!ipLimit.ok) {
    return { success: false, message: rateLimitMessage(ipLimit.retryAfterSec) };
  }
  const emailLimit = checkRateLimit(
    `login:${ip}:${emailKey}`,
    RATE_LIMITS.loginEmail.limit,
    RATE_LIMITS.loginEmail.windowMs
  );
  if (!emailLimit.ok) {
    return { success: false, message: rateLimitMessage(emailLimit.retryAfterSec) };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, message: "Login successful!", redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Invalid email or password.",
          };
        case "AccessDenied":
          return {
            success: false,
            message: "Your account is inactive. Please contact support.",
          };
        default:
          return {
            success: false,
            message: "Something went wrong. Please try again.",
          };
      }
    }
    throw error;
  }
}
