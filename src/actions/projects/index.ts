"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ProjectStatus } from "@/generated/prisma";

const ProjectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  clientId: z.string().min(1, "Client is required"),
  managerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  contractValue: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export async function createProjectAction(_prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    const project = await prisma.project.create({
      data: {
        name: d.name,
        code: d.code,
        description: d.description,
        type: d.type,
        status: d.status ?? ProjectStatus.PLANNING,
        clientId: d.clientId,
        managerId: d.managerId || undefined,
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate ? new Date(d.endDate) : undefined,
        budgetAmount: d.budget ? parseFloat(d.budget) : 0,
        contractValue: d.contractValue ? parseFloat(d.contractValue) : undefined,
        location: d.location,
        city: d.city,
        state: d.state,
        country: d.country ?? "India",
        pincode: d.pincode,
      },
    });
    revalidatePath("/projects");
    redirect(`/projects/${project.id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create project";
    return { error: msg };
  }
}

export async function updateProjectAction(id: string, _prevState: unknown, formData: FormData) {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    await prisma.project.update({
      where: { id },
      data: {
        name: d.name,
        code: d.code,
        description: d.description,
        type: d.type,
        status: d.status,
        clientId: d.clientId,
        managerId: d.managerId || undefined,
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate ? new Date(d.endDate) : null,
        budgetAmount: d.budget ? parseFloat(d.budget) : undefined,
        contractValue: d.contractValue ? parseFloat(d.contractValue) : undefined,
        location: d.location,
        city: d.city,
        state: d.state,
        country: d.country,
        pincode: d.pincode,
      },
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update project";
    return { error: msg };
  }
}

export async function deleteProjectAction(id: string) {
  await requireAuth();
  try {
    await prisma.project.delete({ where: { id } });
    revalidatePath("/projects");
    redirect("/projects");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete project";
    return { error: msg };
  }
}

export async function updateProjectProgressAction(id: string, progress: number) {
  await requireAuth();
  await prisma.project.update({ where: { id }, data: { progress: Math.round(progress) } });
  revalidatePath(`/projects/${id}`);
}
