import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { EmailTemplatesManager } from "@/components/admin/email-templates-manager";
import { ensureDefaultEmailTemplates } from "@/lib/email-templates";
import { seedEmailTemplatesAction } from "@/actions/email";
import { ArrowLeft, Mails, Mail, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Email Templates" };

export default async function EmailTemplatesPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  await ensureDefaultEmailTemplates();

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Mails className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Email Templates
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Edit subject lines and HTML for system emails. Changes apply to the next send.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:pt-8">
          <Link
            href="/settings/email"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Mail className="h-4 w-4 text-slate-500" />
            SMTP
          </Link>
          <form action={seedEmailTemplatesAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              Sync defaults
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Templates
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{templates.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Disabled
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-400">
            {templates.length - activeCount}
          </p>
        </div>
      </div>

      <EmailTemplatesManager templates={templates} />
    </div>
  );
}
