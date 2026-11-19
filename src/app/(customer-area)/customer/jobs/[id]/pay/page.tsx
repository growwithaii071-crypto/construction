import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HomeownerCheckoutButton } from "@/components/marketplace/homeowner-checkout-button";
import { BilingualAlert } from "@/components/ui/bilingual-alert";
import { formatMoney } from "@/lib/money";
import { getPricingConfig } from "@/lib/pricing";
import { buildConnectSplit } from "@/lib/connect-split";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay for job — HomeCreww" };

export default async function JobPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string }>;
}) {
  const session = await requireAuth([UserRole.CLIENT]);
  const { id } = await params;
  const sp = await searchParams;

  const job = await prisma.marketplaceJob.findUnique({
    where: { id },
    include: {
      quotes: {
        where: { status: QuoteStatus.ACCEPTED },
        take: 1,
        include: {
          trader: {
            select: {
              name: true,
              stripeAccountId: true,
              stripeOnboardingDone: true,
              stripePayoutsEnabled: true,
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!job || job.clientId !== session.user.id) notFound();

  if (job.status === MarketplaceJobStatus.FUNDED) {
    redirect(`/customer/jobs/${job.id}?paid=1`);
  }

  const canPay = [
    MarketplaceJobStatus.AWAITING_PAYMENT,
    MarketplaceJobStatus.AWARDED,
  ].includes(job.status as never);

  if (!canPay) {
    redirect(`/customer/jobs/${job.id}`);
  }

  const quote = job.quotes[0];
  const amount = job.payments[0]?.customerTotal ?? quote?.amount ?? undefined;
  const config = await getPricingConfig();
  const split =
    quote != null ? buildConnectSplit(quote.amount, config) : null;
  const traderReady = Boolean(
    quote?.trader.stripeAccountId &&
      quote.trader.stripeOnboardingDone &&
      quote.trader.stripePayoutsEnabled
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href={`/customer/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Secure checkout</h1>
        <p className="mt-1 text-sm text-slate-500">
          One payment — Stripe auto-splits platform commission and trader payout.
        </p>
      </div>

      {sp.paid === "1" && (
        <BilingualAlert
          tone="info"
          en="Payment submitted. Job becomes FUNDED when Stripe confirms via webhook."
 />
      )}
      {sp.cancelled === "1" && (
        <BilingualAlert
          tone="warning"
          en="Checkout cancelled. You can try again when ready."
 />
      )}

      {!traderReady && (
        <BilingualAlert
          tone="warning"
          en="This trader still needs to finish Stripe Connect before you can pay."
 />
      )}

      {split && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
          <h2 className="font-bold text-slate-900">Payment split</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">You pay</span>
              <span className="font-bold text-slate-900">{formatMoney(split.charge)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                HomeCreww commission ({(split.rate * 100).toFixed(0)}%)
              </span>
              <span className="font-semibold text-[#0B2A4A]">
                {formatMoney(split.applicationFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">
                To {(quote?.trader.name ?? "trader").split(" — ")[0]}
              </span>
              <span className="font-extrabold text-emerald-700">
                {formatMoney(split.traderNet)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <HomeownerCheckoutButton
          jobId={job.id}
          amountHint={amount ?? split?.charge}
          disabled={!traderReady}
        />
      </div>
    </div>
  );
}
