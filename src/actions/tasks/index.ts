"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { TaskStatus, TaskPriority } from "@/generated/prisma";

export async function createTaskAction(data: {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}) {
  const session = await requireAuth();
  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeId: data.assigneeId || undefined,
      creatorId: session.user.id,
    },
    include: { assignee: { select: { name: true } } },
  });
  revalidatePath(`/projects/${data.projectId}`);
  return task;
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  await requireAuth();
  await prisma.task.update({ where: { id }, data: { status } });
  const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
  if (task) revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskAction(id: string) {
  await requireAuth();
  const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
  await prisma.task.delete({ where: { id } });
  if (task) revalidatePath(`/projects/${task.projectId}`);
}
