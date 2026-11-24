import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus, QuoteStatus, FeeLedgerStatus, MarketplacePaymentStatus } from "@/generated/prisma";
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
      serviceRequest: { select: { id: true } },
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
          feeLedger: true,
        },
      },
      payments: {
        where: { status: MarketplacePaymentStatus.SUCCEEDED },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!job || job.clientId !== session.user.id) notFound();

  if (job.serviceRequest) {
    const qs = new URLSearchParams();
    if (sp.paid) qs.set("paid", sp.paid);
    if (sp.cancelled) qs.set("cancelled", sp.cancelled);
    const q = qs.toString();
    redirect(
      `/customer/requests/${job.serviceRequest.id}/pay${q ? `?${q}` : ""}`
    );
  }

  const quote = job.quotes[0];
  const dealTotal = quote?.amount ?? 0;
  const amountPaid = job.amountPaid ?? 0;
  const remaining = Math.round((Math.max(0, dealTotal - amountPaid) + Number.EPSILON) * 100) / 100;

  if (remaining <= 0 && job.status === MarketplaceJobStatus.FUNDED) {
    redirect(`/customer/jobs/${job.id}?paid=1`);
  }

  const canPay = [
    MarketplaceJobStatus.AWAITING_PAYMENT,
    MarketplaceJobStatus.AWARDED,
    MarketplaceJobStatus.FUNDED,
    MarketplaceJobStatus.IN_PROGRESS,
  ].includes(job.status as never);

  if (!canPay || remaining <= 0) {
    redirect(`/customer/jobs/${job.id}`);
  }

  const config = await getPricingConfig();
  const firstPayment =
    !(quote?.feeLedger?.status === FeeLedgerStatus.COLLECTED) &&
    !job.payments.some((p) => p.takesCommission);
  const split =
    quote != null
      ? buildConnectSplit(remaining, config, {
          takeCommission: firstPayment,
          dealTotal,
        })
      : null;
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
          Pay in full or in parts. Platform commission is taken on the first payment only.
        </p>
      </div>

      {sp.paid === "1" && (
        <BilingualAlert
          tone="info"
          en="Payment submitted. Balance updates when Stripe confirms via webhook."
        />
      )}
      {sp.cancelled === "1" && (
        <BilingualAlert tone="warning" en="Checkout cancelled. You can try again when ready." />
      )}

      {!traderReady && (
        <BilingualAlert
          tone="warning"
          en="This trader still needs to finish Stripe Connect before you can pay."
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <h2 className="font-bold text-slate-900">Balance</h2>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Agreed total</span>
            <span className="font-bold text-slate-900">{formatMoney(dealTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Paid so far</span>
            <span className="font-semibold text-emerald-700">{formatMoney(amountPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-500">Remaining</span>
            <span className="font-extrabold text-[#0B2A4A]">{formatMoney(remaining)}</span>
          </div>
        </div>
      </div>

      {split && firstPayment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
          <h2 className="font-bold text-slate-900">First-payment commission</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">
                HomeCreww commission ({(split.rate * 100).toFixed(0)}% of deal)
              </span>
              <span className="font-semibold text-[#0B2A4A]">
                {formatMoney(split.applicationFee)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taken once on the first payment. Later installments go to the trader with £0 platform
              fee.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <HomeownerCheckoutButton
          jobId={job.id}
          remaining={remaining}
          dealTotal={dealTotal}
          firstPayment={firstPayment}
          disabled={!traderReady}
        />
      </div>
    </div>
  );
}
