"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useTransition } from "react";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Plus,
  LogOut,
  HardHat,
  Home,
  User,
  ChevronRight,
  TrendingUp,
  Star,
  DollarSign,
  BarChart3,
  FileText,
  Users,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/construction/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/construction/services", label: "My Services", icon: Wrench },
      { href: "/construction/services/new", label: "Add Service", icon: Plus },
    ],
  },
  {
    label: "Requests",
    items: [
      { href: "/construction/requests", label: "Customer Requests", icon: ClipboardList },
      { href: "/construction/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/construction/earnings", label: "Earnings", icon: DollarSign },
      { href: "/construction/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/construction/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/construction/team", label: "My Team", icon: Users },
      { href: "/construction/profile", label: "My Profile", icon: User },
    ],
  },
];

interface ContractorSidebarProps {
  user: { name?: string | null; email?: string | null };
  onClose?: () => void;
}

export function ContractorSidebar({ user, onClose }: ContractorSidebarProps) {
  const pathname = usePathname();
  const [signingOut, startSignOut] = useTransition();

  function isActive(href: string) {
    if (href === "/construction/dashboard") return pathname === "/construction/dashboard";
    return pathname.startsWith(href);
  }

  function handleSignOut() {
    startSignOut(async () => {
      await signOut({ callbackUrl: "/construction/login" });
    });
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "C";

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 shrink-0">
        <Link href="/construction/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">BuildPro</p>
            <p className="text-orange-500 text-[10px] font-medium leading-none mt-0.5">Contractor Portal</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-orange-50 text-orange-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-orange-500" : "text-gray-400")} />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to landing */}
      <div className="px-3 pb-2">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Home className="w-4 h-4 text-gray-400" />
          Back to Home
        </Link>
      </div>

      {/* User card */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name?.split(" — ")[0] ?? user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button onClick={handleSignOut} disabled={signingOut} title="Sign out"
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
