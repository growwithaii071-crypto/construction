import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Mail,
  Phone,
  User,
  Shield,
  Calendar,
  ClipboardList,
  MessageCircle,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile — BuildPro" };

export default async function CustomerProfilePage() {
  const session = await auth();
  const user = session?.user;
  const userId = user?.id ?? "";

  const [dbUser, requests, messageCount] = await Promise.all([
    prisma.user
      .findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true, createdAt: true, isActive: true },
      })
      .catch(() => null),
    prisma.serviceRequest
      .findMany({
        where: { clientId: userId },
        select: { status: true },
      })
      .catch(() => []),
    prisma.message
      .count({ where: { senderId: userId } })
      .catch(() => 0),
  ]);

  const name = dbUser?.name ?? user?.name ?? "Customer";
  const email = dbUser?.email ?? user?.email ?? "—";
  const phone = dbUser?.phone ?? "—";
  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    active: requests.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold ring-2 ring-white/30 backdrop-blur">
              {initials}
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Customer
                </span>
              </div>
              <p className="text-sm text-violet-100">{email}</p>
              <p className="mt-1 text-xs text-violet-200/80">Member since {memberSince}</p>
            </div>
          </div>

          <Link
            href="/customer/services"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
          >
            Browse Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: stats.total, icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Active Jobs", value: stats.active, icon: Wrench, color: "text-blue-600 bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Account info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="mb-5 text-base font-bold text-gray-900">Account Information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: User, label: "Full Name", value: name },
              { icon: Mail, label: "Email", value: email },
              { icon: Phone, label: "Phone", value: phone },
              { icon: Shield, label: "Role", value: "Customer (CLIENT)" },
              { icon: Calendar, label: "Member Since", value: memberSince },
              {
                icon: BadgeCheck,
                label: "Status",
                value: dbUser?.isActive === false ? "Inactive" : "Active & Verified",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-xl border border-gray-50 bg-gray-50/70 p-3.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links + activity */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/customer/services", label: "Browse Services", icon: Wrench },
                { href: "/customer/requests", label: "My Requests", icon: ClipboardList },
                { href: "/customer/messages", label: "Messages", icon: MessageCircle },
              ].map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-violet-500" />
                      {l.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
            <h3 className="font-bold text-violet-900">Activity</h3>
            <p className="mt-1 text-sm text-violet-700/80">
              You&apos;ve sent <strong>{messageCount}</strong> message{messageCount === 1 ? "" : "s"} and have{" "}
              <strong>{stats.active}</strong> active job{stats.active === 1 ? "" : "s"}.
            </p>
            <div className="mt-4 space-y-2 text-sm text-violet-800">
              <a href="mailto:support@buildpro.in" className="flex items-center gap-2 font-medium hover:underline">
                <Mail className="h-4 w-4" /> support@buildpro.in
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2 font-medium hover:underline">
                <Phone className="h-4 w-4" /> +91 98765 43210
              </a>
              <p className="flex items-center gap-2 text-violet-600/80">
                <MapPin className="h-4 w-4" /> Mumbai, India
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
