"use server";

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas/auth";
import { AuthError } from "next-auth";

interface ActionResult {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export async function loginAction(
  formData: unknown,
  callbackUrl?: string
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, message: firstError };
  }

  const { email, password } = parsed.data;
  const redirectTo = callbackUrl ?? "/dashboard";

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
