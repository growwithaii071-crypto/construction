import { requireAuth } from "@/lib/auth-utils";
import { UserRole, DisputeStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResolveDisputeForm } from "@/components/admin/resolve-dispute-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dispute detail — BuildPro" };

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      job: true,
      raisedBy: { select: { name: true, email: true } },
    },
  });
  if (!dispute) notFound();

  const quote = dispute.job.acceptedQuoteId
    ? await prisma.quote.findUnique({
        where: { id: dispute.job.acceptedQuoteId },
        include: { trader: { select: { name: true, email: true } }, feeLedger: true },
      })
    : null;

  const open = [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW].includes(
    dispute.status as typeof DisputeStatus.OPEN
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
      <Link
        href="/disputes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Disputes
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{dispute.job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {dispute.raisedBy.name} · {dispute.raisedBy.email}
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            {dispute.status.replaceAll("_", " ")}
          </span>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {dispute.reason}
        </p>

        {quote && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p>
              Trader: <strong>{quote.trader.name}</strong> ({quote.trader.email})
            </p>
            <p className="mt-1">
              Quote ₹{quote.amount.toLocaleString("en-IN")}
              {quote.feeLedger
                ? ` · Fee ₹${quote.feeLedger.amount.toLocaleString("en-IN")} (${quote.feeLedger.status})`
                : ""}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Job status: {dispute.job.status} · Protection: {dispute.job.protectionStatus}
            </p>
          </div>
        )}

        {dispute.resolution && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Resolution: {dispute.resolution}
          </p>
        )}
      </div>

      {open && quote && (
        <ResolveDisputeForm disputeId={dispute.id} quoteAmount={quote.amount} />
      )}
    </div>
  );
}
