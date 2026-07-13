"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";

const ContractorRegisterSchema = z
  .object({
    name: z.string().min(2),
    companyName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    specialization: z.string().min(1),
    licenseNumber: z.string().optional(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function contractorRegisterAction(formData: unknown) {
  const parsed = ContractorRegisterSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, message: firstError };
  }

  const { name, companyName, email, phone, specialization, licenseNumber, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "An account with this email already exists." };
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        name: `${name} — ${companyName}`,
        email,
        password: hashedPassword,
        phone,
        role: UserRole.CONTRACTOR,
        isActive: true,
        emailVerified: new Date(),
        // store extra info in avatar field temporarily as JSON string
        avatar: JSON.stringify({ companyName, specialization, licenseNumber }),
      },
    });

    return {
      success: true,
      message: "Company registered! You can now sign in.",
    };
  } catch (error) {
    console.error("[CONTRACTOR_REGISTER]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
