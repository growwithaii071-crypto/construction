import { requireAuth } from "@/lib/auth-utils";
import { UserRole, QuoteStatus, MarketplacePaymentStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReceiptPrintButton } from "@/components/marketplace/receipt-print-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payout receipt — BuildPro" };

export default async function ContractorJobReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: {
      jobId: id,
      traderId: session.user.id,
      status: QuoteStatus.ACCEPTED,
    },
    include: {
      job: {
        include: {
          payments: { orderBy: { createdAt: "desc" }, take: 2 },
          client: { select: { name: true, email: true } },
        },
      },
      feeLedger: true,
    },
  });

  if (!quote) notFound();

  const job = quote.job;
  const payment = job.payments.find(
    (p) => p.status === MarketplacePaymentStatus.SUCCEEDED
  );
  const payout = await prisma.payout.findFirst({
    where: { jobId: id, traderId: session.user.id },
  });

  const receiptNo = `BP-T-${job.id.slice(-8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 lg:p-6 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/construction/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <ReceiptPrintButton />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
        <header className="flex justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-lg font-extrabold text-[#0B2A4A]">
              Build<span className="text-orange-500">Pro</span>
            </p>
            <p className="text-xs text-slate-500">Trader payout summary</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-800">{receiptNo}</p>
            <p className="font-bold uppercase text-slate-700">{job.status.replaceAll("_", " ")}</p>
          </div>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400">Customer</p>
            <p className="mt-1 text-sm font-semibold">{job.client.name}</p>
            <p className="text-xs text-slate-500">{job.client.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400">Job</p>
            <p className="mt-1 text-sm font-semibold">{job.title}</p>
            <p className="text-xs text-slate-500">{job.category}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-50">
              <td className="py-2.5 text-slate-600">Accepted quote</td>
              <td className="py-2.5 text-right font-medium">
                ₹{quote.amount.toLocaleString("en-IN")}
              </td>
            </tr>
            {quote.feeLedger && (
              <tr className="border-b border-slate-50">
                <td className="py-2.5 text-slate-600">
                  Success fee ({quote.feeLedger.status})
                </td>
                <td className="py-2.5 text-right font-medium text-rose-700">
                  −₹{quote.feeLedger.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
            {payment && (
              <tr className="border-b border-slate-50">
                <td className="py-2.5 text-slate-600">Customer paid (incl. protection)</td>
                <td className="py-2.5 text-right font-medium">
                  ₹{payment.customerTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
            <tr>
              <td className="pt-4 font-extrabold text-[#0B2A4A]">Your net payout</td>
              <td className="pt-4 text-right text-lg font-extrabold text-emerald-700">
                ₹
                {(
                  payout?.netAmount ??
                  Math.max(0, quote.amount - (quote.feeLedger?.amount ?? 0))
                ).toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>

        {payout?.stripeTransferId && (
          <p className="mt-4 text-xs text-slate-500">
            Stripe transfer: {payout.stripeTransferId}
          </p>
        )}
      </article>
    </div>
  );
}
