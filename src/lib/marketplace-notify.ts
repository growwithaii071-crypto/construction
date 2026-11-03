import prisma from "@/lib/prisma";
import { createNotification, type NotificationType } from "@/lib/notifications";
import { sendTemplateEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";

type NotifyOpts = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  /** Email template key (optional) */
  emailKey?: string;
  emailVars?: Record<string, string>;
};

/** In-app notification + optional template email (looks up user email). */
export async function notifyUserWithEmail(opts: NotifyOpts) {
  void createNotification({
    userId: opts.userId,
    title: opts.title,
    message: opts.message,
    type: opts.type,
    link: opts.link,
  });

  if (!opts.emailKey) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { email: true, name: true },
    });
    if (!user?.email) return;

    const base = getAppUrl();
    await sendTemplateEmail(opts.emailKey, user.email, {
      userName: user.name.split(" — ")[0] ?? user.name,
      appUrl: base,
      actionUrl: opts.link ? `${base}${opts.link.startsWith("/") ? "" : "/"}${opts.link}` : base,
      ...opts.emailVars,
    });
  } catch (err) {
    console.error("[MARKETPLACE_NOTIFY_EMAIL]", err);
  }
}
