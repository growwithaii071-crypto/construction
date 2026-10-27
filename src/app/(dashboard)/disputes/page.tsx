import { requireAuth } from "@/lib/auth-utils";
import { UserRole, DisputeStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Scale, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disputes — BuildPro Admin" };

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const { tab } = await searchParams;
  const showReports = tab === "reports";

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      job: { select: { id: true, title: true, protectionStatus: true, status: true } },
      raisedBy: { select: { name: true, email: true } },
    },
  });

  const reports = showReports
    ? await prisma.auditLog.findMany({
        where: { action: "report_problem" },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const openCount = disputes.filter((d) =>
    [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW].includes(d.status as typeof DisputeStatus.OPEN)
  ).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketplace disputes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Protected disputes hold funds. Unprotected reports are log-only.
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/disputes"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${!showReports ? "bg-[#0B2A4A] text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Disputes ({openCount} open)
        </Link>
        <Link
          href="/disputes?tab=reports"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${showReports ? "bg-[#0B2A4A] text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Problem reports
        </Link>
      </div>

      {showReports ? (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No problem reports yet.</p>
          ) : (
            reports.map((r) => {
              const after = (r.after ?? {}) as {
                reason?: string;
                jobStatus?: string;
              };
              return (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Unprotected report · job {r.entityId.slice(-8)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{after.reason}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {r.createdAt.toLocaleString("en-IN")}
                        {after.jobStatus ? ` · job was ${after.jobStatus}` : ""}
                        {" · "}no refund guarantee
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <Scale className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="font-semibold text-slate-700">No disputes</p>
            </div>
          ) : (
            disputes.map((d) => (
              <Link
                key={d.id}
                href={`/disputes/${d.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-slate-900">{d.job.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Raised by {d.raisedBy.name} · {d.raisedBy.email}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{d.reason}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {d.status.replaceAll("_", " ")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
