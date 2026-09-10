"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ContractorSidebar } from "./contractor-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface ContractorTopbarProps {
  user: { name?: string | null; email?: string | null };
}

export function ContractorTopbar({ user }: ContractorTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <p className="font-semibold text-gray-900 text-sm">Contractor Portal</p>
        <NotificationBell
          allHref="/construction/notifications"
          className="text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        />
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex bg-white border-b border-gray-100 h-14 items-center justify-between px-6 shrink-0">
        <p className="font-semibold text-gray-900">Contractor Portal</p>
        <NotificationBell
          allHref="/construction/notifications"
          className="text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden flex">
            <ContractorSidebar user={user} onClose={() => setDrawerOpen(false)} />
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
