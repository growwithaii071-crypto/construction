import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HomeownerCheckoutButton } from "@/components/marketplace/homeowner-checkout-button";
import { BilingualAlert } from "@/components/ui/bilingual-alert";
import { formatMoney } from "@/lib/money";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay for job — BuildPro" };

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

  const amount =
    job.payments[0]?.customerTotal ?? job.quotes[0]?.amount ?? undefined;

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
          Pay through Stripe Checkout. Funds are held on BuildPro until release rules apply.
          {amount != null ? ` Amount: ${formatMoney(amount)}.` : ""}
        </p>
      </div>

      {sp.paid === "1" && (
        <BilingualAlert
          tone="info"
          en="Payment submitted. Job becomes FUNDED when Stripe confirms via webhook."
          hi="भुगतान भेज दिया। Stripe webhook कन्फर्म होते ही जॉब FUNDED होगा।"
        />
      )}
      {sp.cancelled === "1" && (
        <BilingualAlert
          tone="warning"
          en="Checkout cancelled. You can try again when ready."
          hi="चेकआउट रद्द। जब तैयार हों फिर कोशिश करें।"
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <HomeownerCheckoutButton jobId={job.id} amountHint={amount} />
      </div>
    </div>
  );
}
