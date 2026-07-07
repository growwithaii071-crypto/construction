"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const ContractorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  specialization: z.string().optional(),
  gst: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  rating: z.string().optional(),
  notes: z.string().optional(),
});

export async function createContractorAction(_prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ContractorSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    const contractor = await prisma.contractor.create({
      data: {
        name: d.name,
        email: d.email || undefined,
        phone: d.phone,
        company: d.company,
        specialization: d.specialization,
        gst: d.gst,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        rating: d.rating ? parseFloat(d.rating) : undefined,
        notes: d.notes,
      },
    });
    revalidatePath("/contractors");
    redirect(`/contractors/${contractor.id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create";
    return { error: msg };
  }
}

export async function updateContractorAction(id: string, _prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ContractorSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    await prisma.contractor.update({
      where: { id },
      data: {
        name: d.name,
        email: d.email || undefined,
        phone: d.phone,
        company: d.company,
        specialization: d.specialization,
        gst: d.gst,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        rating: d.rating ? parseFloat(d.rating) : undefined,
        notes: d.notes,
      },
    });
    revalidatePath("/contractors");
    revalidatePath(`/contractors/${id}`);
    redirect(`/contractors/${id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update";
    return { error: msg };
  }
}

export async function deleteContractorAction(id: string) {
  await requireAuth();
  await prisma.contractor.delete({ where: { id } });
  revalidatePath("/contractors");
  redirect("/contractors");
}
