"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  HardHat,
  Package,
  Truck,
  FileText,
  Receipt,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Projects",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/contractors", label: "Contractors", icon: HardHat },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/materials", label: "Materials", icon: Package },
      { href: "/equipment", label: "Equipment", icon: Truck },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/site-reports", label: "Site Reports", icon: ClipboardList },
      { href: "/issues", label: "Issues", icon: AlertTriangle },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: TrendingUp },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white tracking-tight">BuildPro</p>
            <p className="text-[10px] text-slate-400 leading-none">Construction CMS</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            active ? "text-white" : "text-slate-500"
                          )}
                        />
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] text-slate-400">System Online · v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
