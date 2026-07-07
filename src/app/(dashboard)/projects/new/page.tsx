import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireAuth();

  const [clients, managers] = await Promise.all([
    prisma.client
      .findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      .catch(() => []),
    prisma.user
      .findMany({
        select: { id: true, name: true },
        where: { isActive: true },
        orderBy: { name: "asc" },
      })
      .catch(() => []),
  ]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
          <p className="text-sm text-gray-500">Create a new construction project</p>
        </div>
      </div>
      <ProjectForm clients={clients} managers={managers} />
    </div>
  );
}
