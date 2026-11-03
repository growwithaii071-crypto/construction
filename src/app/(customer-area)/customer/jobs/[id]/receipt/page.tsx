import { requireAuth } from "@/lib/auth-utils";
import { UserRole, QuoteStatus, MarketplacePaymentStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReceiptPrintButton } from "@/components/marketplace/receipt-print-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment receipt — BuildPro" };

export default async function CustomerJobReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth([UserRole.CLIENT]);
  const { id } = await params;

  const job = await prisma.marketplaceJob.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 3 },
      payouts: true,
    },
  });

  if (!job || job.clientId !== session.user.id) notFound();

  const payment = job.payments.find(
    (p) =>
      p.status === MarketplacePaymentStatus.SUCCEEDED ||
      p.status === MarketplacePaymentStatus.PARTIALLY_REFUNDED ||
      p.status === MarketplacePaymentStatus.REFUNDED
  );

  if (!payment) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Link
          href={`/customer/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          No successful payment found for this job yet. Receipts appear after Stripe confirms
          payment.
        </div>
      </div>
    );
  }

  const quote = job.acceptedQuoteId
    ? await prisma.quote.findUnique({
        where: { id: job.acceptedQuoteId },
        include: {
          trader: { select: { name: true, email: true } },
          feeLedger: true,
        },
      })
    : await prisma.quote.findFirst({
        where: { jobId: job.id, status: QuoteStatus.ACCEPTED },
        include: {
          trader: { select: { name: true, email: true } },
          feeLedger: true,
        },
      });

  const customer = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { name: true, email: true },
  });

  const receiptNo = `BP-${job.id.slice(-8).toUpperCase()}-${payment.id.slice(-4).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 lg:p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/customer/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <ReceiptPrintButton />
      </div>

      <article
        id="receipt"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none sm:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-[#0B2A4A]">
              Build<span className="text-orange-500">Pro</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Marketplace payment receipt</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-800">Receipt {receiptNo}</p>
            <p>
              {payment.createdAt.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 font-bold uppercase text-emerald-700">{payment.status}</p>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Billed to
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{customer?.name}</p>
            <p className="text-xs text-slate-500">{customer?.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Trader
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {quote?.trader.name.split(" — ")[0] ?? "—"}
            </p>
            <p className="text-xs text-slate-500">{quote?.trader.email ?? "—"}</p>
          </div>
        </section>

        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Job</p>
          <p className="mt-1 text-base font-bold text-slate-900">{job.title}</p>
          <p className="text-xs text-slate-500">
            {job.category}
            {job.location ? ` · ${job.location}` : ""} · Status {job.status.replaceAll("_", " ")}
            {job.protectionStatus !== "UNDECIDED"
              ? ` · ${job.protectionStatus}`
              : ""}
          </p>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            <tr className="border-b border-slate-50">
              <td className="py-2.5">Quoted work</td>
              <td className="py-2.5 text-right font-medium">
                ₹{payment.quoteAmount.toLocaleString("en-IN")}
              </td>
            </tr>
            {payment.protectionOptedIn && payment.protectionFee > 0 && (
              <tr className="border-b border-slate-50">
                <td className="py-2.5">Payment protection fee</td>
                <td className="py-2.5 text-right font-medium">
                  ₹{payment.protectionFee.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
            {quote?.feeLedger && (
              <tr className="border-b border-slate-50 text-slate-500">
                <td className="py-2.5">
                  Platform success fee (deducted from trader payout)
                </td>
                <td className="py-2.5 text-right">
                  ₹{quote.feeLedger.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-base font-extrabold text-[#0B2A4A]">You paid</td>
              <td className="pt-4 text-right text-lg font-extrabold text-[#0B2A4A]">
                ₹{payment.customerTotal.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>

        {job.payouts[0] && (
          <p className="mt-4 text-xs text-slate-500">
            Trader net payout recorded: ₹{job.payouts[0].netAmount.toLocaleString("en-IN")}
            {job.payouts[0].stripeTransferId
              ? ` · Transfer ${job.payouts[0].stripeTransferId}`
              : ""}
          </p>
        )}

        <footer className="mt-8 border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400">
          <p>Terms version: {payment.termsVersion}</p>
          {payment.stripePaymentIntentId && (
            <p className="mt-0.5">Payment reference: {payment.stripePaymentIntentId}</p>
          )}
          <p className="mt-2">
            This is a computer-generated receipt from BuildPro. For support, contact your platform
            admin.
          </p>
        </footer>
      </article>
    </div>
  );
}
