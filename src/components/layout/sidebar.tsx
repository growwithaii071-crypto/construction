"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  ShieldCheck,
  Wrench,
  Mail,
  Mails,
  Bell,
  Shield,
  ChevronDown,
  Briefcase,
  Boxes,
  Cog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type NavChild = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavItem =
  | {
      type: "link";
      href: string;
      label: string;
      icon: LucideIcon;
    }
  | {
      type: "group";
      id: string;
      label: string;
      icon: LucideIcon;
      children: NavChild[];
    };

const NAV: NavItem[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    type: "link",
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    type: "group",
    id: "marketplace",
    label: "Marketplace",
    icon: Briefcase,
    children: [
      { href: "/projects", label: "Projects / Jobs", icon: FolderKanban },
      { href: "/admin/services", label: "Services", icon: Wrench },
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/contractors", label: "Contractors", icon: HardHat },
    ],
  },
  {
    type: "group",
    id: "resources",
    label: "Resources",
    icon: Boxes,
    children: [
      { href: "/materials", label: "Materials", icon: Package },
      { href: "/equipment", label: "Equipment", icon: Truck },
    ],
  },
  {
    type: "group",
    id: "operations",
    label: "Operations",
    icon: ClipboardList,
    children: [
      { href: "/site-reports", label: "Site Reports", icon: ClipboardList },
      { href: "/issues", label: "Issues", icon: AlertTriangle },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    type: "group",
    id: "finance",
    label: "Finance",
    icon: Wallet,
    children: [
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: TrendingUp },
    ],
  },
  {
    type: "group",
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    children: [
      { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
      { href: "/users", label: "Users", icon: Users },
      { href: "/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    type: "group",
    id: "settings",
    label: "Settings",
    icon: Cog,
    children: [
      { href: "/settings", label: "General", icon: Settings },
      { href: "/settings/email", label: "Email / SMTP", icon: Mail },
      { href: "/settings/email-templates", label: "Email Templates", icon: Mails },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/settings") return pathname === "/settings";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, children: NavChild[]) {
  return children.some((c) => isItemActive(pathname, c.href));
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open the group that contains the active route
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const item of NAV) {
        if (item.type === "group" && groupHasActive(pathname, item.children)) {
          next[item.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex h-full min-h-0 w-64 flex-col bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 transition-shadow group-hover:shadow-orange-500/50">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">BuildPro</p>
            <p className="text-[10px] leading-none text-slate-400">Construction CMS</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            if (item.type === "link") {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                </li>
              );
            }

            const open = openGroups[item.id] ?? false;
            const parentActive = groupHasActive(pathname, item.children);
            const Icon = item.icon;

            return (
              <li key={item.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  aria-expanded={open}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150",
                    parentActive && !open
                      ? "bg-slate-800/80 text-orange-400"
                      : parentActive
                        ? "text-orange-400"
                        : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      parentActive ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-400"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                      open && "rotate-180",
                      parentActive && "text-orange-400/80"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="relative mt-1 ml-4 space-y-0.5 border-l border-slate-700/80 py-1 pl-3">
                      {item.children.map((child) => {
                        const active = isItemActive(pathname, child.href);
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                                active
                                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                              )}
                            >
                              {/* connector dot on the left border */}
                              <span
                                className={cn(
                                  "absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
                                  active ? "bg-orange-400" : "bg-slate-600"
                                )}
                              />
                              <ChildIcon
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  active ? "text-white" : "text-slate-500"
                                )}
                              />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-2 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <p className="text-[11px] text-slate-400">System Online · v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
