import { requireAuth } from "@/lib/auth-utils";
import { UserRole, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, BadgeCheck } from "lucide-react";
import { TraderJobActions } from "@/components/marketplace/job-lifecycle-actions";
import { processAutoConfirms } from "@/lib/marketplace-payouts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Job — BuildPro Contractor" };

export default async function ContractorJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const { id } = await params;
  void processAutoConfirms(3);

  const quote = await prisma.quote.findFirst({
    where: {
      jobId: id,
      traderId: session.user.id,
      status: QuoteStatus.ACCEPTED,
    },
    include: {
      job: true,
      feeLedger: true,
    },
  });

  if (!quote) notFound();

  const payout = await prisma.payout.findFirst({
    where: { jobId: id, traderId: session.user.id },
  });

  const job = quote.job;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <Link
        href="/construction/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Accepted jobs
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{job.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {job.status.replaceAll("_", " ")}
            </span>
            {job.protectionStatus === "PROTECTED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                <BadgeCheck className="h-3 w-3" />
                Protected job
              </span>
            )}
          </div>
        </div>

        {job.location && (
          <p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {job.location}
          </p>
        )}

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {job.description}
        </p>

        <div className="mt-5 grid gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Your quote</span>
            <span className="font-bold">₹{quote.amount.toLocaleString("en-IN")}</span>
          </div>
          {quote.feeLedger && (
            <div className="flex justify-between">
              <span className="text-slate-500">Success fee ({quote.feeLedger.status})</span>
              <span className="font-semibold text-slate-800">
                ₹{quote.feeLedger.amount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          {payout && (
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Net payout</span>
              <span className="font-extrabold text-emerald-700">
                ₹{payout.netAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {job.status === "DISPUTED" && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-bold">Dispute open</p>
            <p className="mt-1 text-amber-800/90">
              Payout is held until an admin resolves this case. You&apos;ll be notified of the outcome.
            </p>
          </div>
        )}

        <div className="mt-6">
          <TraderJobActions jobId={job.id} status={job.status} />
        </div>

        {job.protectionStatus === "UNPROTECTED" && job.status === "FUNDED" && (
          <p className="mt-3 text-xs text-slate-400">
            Unprotected: marking started may release your payout (minus success fee) immediately.
          </p>
        )}
        {job.protectionStatus === "PROTECTED" && (
          <p className="mt-3 text-xs text-slate-400">
            Protected: payout releases after the customer confirms completion (or auto-confirm).
          </p>
        )}
      </div>
    </div>
  );
}
