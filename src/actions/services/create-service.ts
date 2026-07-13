"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

const CreateServiceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  priceFrom: z.coerce.number().min(0).optional(),
  priceTo: z.coerce.number().min(0).optional(),
  priceUnit: z.string().optional(),
});

export async function createServiceAction(formData: unknown) {
  const session = await requireAuth([UserRole.CONTRACTOR]);

  const parsed = CreateServiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.service.create({
      data: {
        ...parsed.data,
        contractorId: session.user.id,
      },
    });

    revalidatePath("/construction/services");
    return { success: true, message: "Service added successfully!" };
  } catch (error) {
    console.error("[CREATE_SERVICE]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

export async function toggleServiceAction(id: string, isActive: boolean) {
  await requireAuth([UserRole.CONTRACTOR]);

  await prisma.service.update({ where: { id }, data: { isActive } });
  revalidatePath("/construction/services");
}
