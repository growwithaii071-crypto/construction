import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [project, clients, managers] = await Promise.all([
    prisma.project.findUnique({ where: { id } }).catch(() => null),
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

  if (!project) notFound();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>
      </div>
      <ProjectForm clients={clients} managers={managers} project={project} />
    </div>
  );
}
