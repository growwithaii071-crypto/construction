"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, ChevronDown, User, Settings, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth/logout";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ROLE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-orange-100 text-orange-700",
  PROJECT_MANAGER: "bg-blue-100 text-blue-700",
  SITE_ENGINEER: "bg-purple-100 text-purple-700",
  ACCOUNTANT: "bg-green-100 text-green-700",
  FOREMAN: "bg-amber-100 text-amber-700",
  VIEWER: "bg-gray-100 text-gray-500",
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/clients": "Clients",
  "/contractors": "Contractors",
  "/materials": "Materials",
  "/equipment": "Equipment",
  "/site-reports": "Site Reports",
  "/issues": "Issues",
  "/documents": "Documents",
  "/invoices": "Invoices",
  "/expenses": "Expenses",
  "/users": "Team Members",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) return title;
  }
  return "BuildPro";
}

export function Header() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const user = session?.user;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const pageTitle = getPageTitle(pathname);
  const roleLabel = user?.role ? ROLE_LABELS[user.role as UserRole] : "";
  const roleBadgeColor = ROLE_BADGE_COLORS[user?.role ?? ""] ?? "bg-gray-100 text-gray-500";

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30 shadow-sm">
        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo — mobile only */}
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-linear-to-br from-orange-400 to-orange-600 rounded-md flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">BuildPro</span>
        </Link>

        {/* Page title — desktop */}
        <h1 className="hidden lg:block text-lg font-semibold text-slate-900">{pageTitle}</h1>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 relative text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />
          </Button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 pl-2 pr-3 h-10 rounded-xl hover:bg-slate-100 transition-colors outline-none cursor-pointer">
              <Avatar className="w-8 h-8 ring-2 ring-orange-100">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="bg-linear-to-br from-orange-400 to-orange-600 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
                <p className={cn("text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full inline-block", roleBadgeColor)}>
                  {roleLabel}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 shadow-xl border-slate-200 rounded-xl p-1"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-400 font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="rounded-lg mx-0.5 gap-2.5 cursor-pointer" asChild>
                <Link href="/settings/profile">
                  <User className="w-4 h-4 text-slate-500" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg mx-0.5 gap-2.5 cursor-pointer" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 text-slate-500" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="rounded-lg mx-0.5 gap-2.5 text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onSelect={() => {
                  const form = document.getElementById("logout-form") as HTMLFormElement;
                  form?.requestSubmit();
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
              <form id="logout-form" action={logoutAction} className="hidden" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
