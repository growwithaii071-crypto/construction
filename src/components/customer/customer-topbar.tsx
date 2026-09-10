"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CustomerSidebar } from "./customer-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface CustomerTopbarProps {
  user: { name?: string | null; email?: string | null };
  title: string;
}

export function CustomerTopbar({ user, title }: CustomerTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <NotificationBell
          allHref="/customer/notifications"
          className="text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        />
      </header>

      <header className="hidden lg:flex bg-white border-b border-gray-100 h-14 items-center justify-between px-6 shrink-0">
        <p className="font-semibold text-gray-900">{title}</p>
        <NotificationBell
          allHref="/customer/notifications"
          className="text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        />
      </header>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden flex">
            <CustomerSidebar user={user} onClose={() => setDrawerOpen(false)} />
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-[-44px] w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
