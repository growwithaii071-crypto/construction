"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  deleteNotificationAction,
} from "@/actions/notifications";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date | string;
};

const TYPE_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  WARNING: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
  INFO: "bg-violet-100 text-violet-700",
};

export function NotificationsList({ items }: { items: Notif[] }) {
  const [pending, start] = useTransition();

  function markAll() {
    start(async () => {
      await markAllNotificationsReadAction();
    });
  }

  function markOne(id: string) {
    start(async () => {
      await markNotificationReadAction(id);
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteNotificationAction(id);
    });
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {unread > 0 ? `${unread} unread` : "All caught up"} · {items.length} total
        </p>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-gray-200" />
          <p className="mt-3 font-semibold text-gray-900">No notifications</p>
          <p className="mt-1 text-sm text-gray-500">Updates about jobs and messages will show here.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
          {items.map((n) => {
            const body = (
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-sm text-gray-900",
                      !n.isRead ? "font-bold" : "font-semibold"
                    )}
                  >
                    {n.title}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      TYPE_STYLES[n.type] ?? TYPE_STYLES.INFO
                    )}
                  >
                    {n.type}
                  </span>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                <p className="mt-1.5 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            );

            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
                  !n.isRead && "border-orange-100 bg-orange-50/30"
                )}
              >
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => {
                      if (!n.isRead) markOne(n.id);
                    }}
                    className="min-w-0 flex-1 hover:opacity-90"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}

                <div className="flex shrink-0 flex-col gap-1">
                  {!n.isRead && (
                    <button
                      type="button"
                      title="Mark read"
                      onClick={() => markOne(n.id)}
                      disabled={pending}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-orange-600"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => remove(n.id)}
                    disabled={pending}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
