"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { getRoleHome } from "@/lib/role-home";

function notificationsPathForRole(role?: string | null) {
  if (role === "CLIENT") return "/customer/notifications";
  if (role === "CONTRACTOR") return "/construction/notifications";
  return "/notifications";
}

export async function getMyNotificationsAction(limit = 20) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount };
}

export async function markNotificationReadAction(id: string) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath(notificationsPathForRole(role));
  revalidatePath(getRoleHome(role));
  return { success: true as const };
}

export async function markAllNotificationsReadAction() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath(notificationsPathForRole(role));
  revalidatePath(getRoleHome(role));
  return { success: true as const };
}

export async function deleteNotificationAction(id: string) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;

  await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath(notificationsPathForRole(role));
  return { success: true as const };
}
