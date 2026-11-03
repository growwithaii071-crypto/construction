"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { CustomerSidebar } from "./customer-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

interface CustomerTopbarProps {
  user: { name?: string | null; email?: string | null };
  title: string;
}

export function CustomerTopbar({ user, title }: CustomerTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B2A4A] hover:bg-orange-50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-bold text-[#0B2A4A]">{title}</p>
          <p className="text-[10px] font-semibold text-orange-500">Customer</p>
        </div>
        <NotificationBell
          allHref="/customer/notifications"
          className="text-slate-500 hover:bg-orange-50 hover:text-orange-600"
        />
      </header>

      <header className="hidden h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6 lg:flex">
        <p className="font-semibold text-[#0B2A4A]">{title}</p>
        <NotificationBell
          allHref="/customer/notifications"
          className="text-slate-500 hover:bg-orange-50 hover:text-orange-600"
        />
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-[#0B2A4A]/40 backdrop-blur-[1px] transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 shadow-2xl transition-transform duration-300 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <CustomerSidebar user={user} onClose={() => setDrawerOpen(false)} />
        </div>
      </div>
    </>
  );
}
