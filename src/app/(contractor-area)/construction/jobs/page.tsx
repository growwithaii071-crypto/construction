import { requireAuth } from "@/lib/auth-utils";
import { UserRole, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { processAutoConfirms } from "@/lib/marketplace-payouts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Jobs — BuildPro Contractor" };

export default async function ContractorJobsPage() {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  // Opportunistic auto-confirm sweep
  void processAutoConfirms(5);

  const quotes = await prisma.quote.findMany({
    where: {
      traderId: session.user.id,
      status: QuoteStatus.ACCEPTED,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          category: true,
          location: true,
          status: true,
          protectionStatus: true,
        },
      },
      feeLedger: { select: { amount: true, status: true } },
    },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accepted jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Start work, complete jobs, and track payouts after success fee
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-800">No accepted jobs yet</p>
          <p className="mt-1 text-sm text-slate-500">When a customer accepts your quote, it appears here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Link
              key={q.id}
              href={`/construction/jobs/${q.job.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900">{q.job.title}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{q.job.category}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    {q.job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {q.job.location}
                      </span>
                    )}
                    <span>Quote ₹{q.amount.toLocaleString("en-IN")}</span>
                    {q.feeLedger && (
                      <span>
                        Fee ₹{q.feeLedger.amount.toLocaleString("en-IN")} ({q.feeLedger.status})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {q.job.status.replaceAll("_", " ")}
                  </span>
                  {q.job.protectionStatus === "PROTECTED" && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                      Protected job
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
