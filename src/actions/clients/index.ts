"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const ClientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  gst: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientAction(_prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ClientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    const client = await prisma.client.create({
      data: {
        name: d.name,
        email: d.email || undefined,
        phone: d.phone,
        company: d.company,
        gst: d.gst,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        notes: d.notes,
      },
    });
    revalidatePath("/clients");
    redirect(`/clients/${client.id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create client";
    return { error: msg };
  }
}

export async function updateClientAction(id: string, _prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ClientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    await prisma.client.update({
      where: { id },
      data: {
        name: d.name,
        email: d.email || undefined,
        phone: d.phone,
        company: d.company,
        gst: d.gst,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        notes: d.notes,
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    redirect(`/clients/${id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update client";
    return { error: msg };
  }
}

export async function deleteClientAction(id: string) {
  await requireAuth();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
