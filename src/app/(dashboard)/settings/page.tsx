import { requireAuth, ROLE_LABELS } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import Link from "next/link";
import {
  User,
  Mail,
  Mails,
  ChevronRight,
  Shield,
  Settings2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

type SettingItem = {
  icon: typeof User;
  label: string;
  desc: string;
  href: string;
  tone: "orange" | "violet" | "slate";
};

const ACCOUNT_ITEMS: SettingItem[] = [
  {
    icon: User,
    label: "Profile & password",
    desc: "Update your name, phone and login password",
    href: "/settings/profile",
    tone: "orange",
  },
];

const EMAIL_ITEMS: SettingItem[] = [
  {
    icon: Mail,
    label: "SMTP Settings",
    desc: "Host, port, username & from address for outgoing mail",
    href: "/settings/email",
    tone: "violet",
  },
  {
    icon: Mails,
    label: "Email Templates",
    desc: "Subjects & HTML for requests, messages, welcome mail",
    href: "/settings/email-templates",
    tone: "violet",
  },
];

const TONE: Record<SettingItem["tone"], string> = {
  orange: "bg-orange-50 text-orange-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

function SettingLink({ item }: { item: SettingItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:p-5"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE[item.tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 group-hover:text-orange-700">
          {item.label}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
    </Link>
  );
}

export default async function SettingsPage() {
  const session = await requireAuth();
  const role = (session.user as { role?: UserRole }).role;
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  const name = session.user?.name ?? "User";
  const email = session.user?.email ?? "";

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
            <Settings2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Account preferences
              {isAdmin ? " and email configuration" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">
              {email}
              {role ? ` · ${ROLE_LABELS[role] ?? role}` : ""}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {ACCOUNT_ITEMS.map((item) => (
            <SettingLink key={item.href} item={item} />
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email
            </h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {EMAIL_ITEMS.map((item) => (
              <SettingLink key={item.href} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
