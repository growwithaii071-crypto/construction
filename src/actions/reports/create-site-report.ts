"use server";

import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSiteReportAction(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAuth();

  try {
    await prisma.siteReport.create({
      data: {
        projectId: formData.get("projectId") as string,
        reporterId: session.user.id,
        reportDate: new Date(formData.get("reportDate") as string),
        weather: formData.get("weather") as string,
        summary: formData.get("summary") as string,
        workProgress: formData.get("workProgress")
          ? parseInt(formData.get("workProgress") as string)
          : undefined,
        totalWorkers: formData.get("totalWorkers")
          ? parseInt(formData.get("totalWorkers") as string)
          : undefined,
        activities: formData.get("activities") as string,
        issues: formData.get("issues") as string,
        materials: formData.get("materials") as string,
        nextDayPlan: formData.get("nextDayPlan") as string,
      },
    });
    revalidatePath("/site-reports");
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to save report" };
  }
}
