"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
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

const TYPE_DOT: Record<string, string> = {
  SUCCESS: "bg-green-500",
  WARNING: "bg-amber-500",
  ERROR: "bg-red-500",
  INFO: "bg-violet-500",
};

export function NotificationBell({
  allHref,
  className,
  iconClassName,
}: {
  allHref: string;
  className?: string;
  iconClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [pending, start] = useTransition();

  const load = useCallback(() => {
    start(async () => {
      const res = await getMyNotificationsAction(12);
      setItems(res.items);
      setUnread(res.unreadCount);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  function onMarkAll() {
    start(async () => {
      await markAllNotificationsReadAction();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    });
  }

  function onClickItem(n: Notif) {
    start(async () => {
      if (!n.isRead) {
        await markNotificationReadAction(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
        setUnread((c) => Math.max(0, c - 1));
      }
      setOpen(false);
      if (n.link) router.push(n.link);
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-800",
          className
        )}
        aria-label="Notifications"
      >
        <Bell className={cn("h-4 w-4", iconClassName)} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-slate-200 p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-[11px] text-slate-400">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={onMarkAll}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-violet-600 hover:bg-violet-50 disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!loaded || (pending && items.length === 0) ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-200" />
              <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onClickItem(n)}
                className={cn(
                  "flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                  !n.isRead && "bg-orange-50/40"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    TYPE_DOT[n.type] ?? TYPE_DOT.INFO
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm text-slate-900",
                      !n.isRead ? "font-semibold" : "font-medium"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
          <Link
            href={allHref}
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
