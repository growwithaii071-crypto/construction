import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStripePublishableKey } from "@/lib/stripe";
import { JobCheckout } from "@/components/marketplace/job-checkout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay for job — BuildPro" };

export default async function JobPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const session = await requireAuth([UserRole.CLIENT]);
  const { id } = await params;
  const sp = await searchParams;

  const job = await prisma.marketplaceJob.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      clientId: true,
      status: true,
      protectionStatus: true,
    },
  });

  if (!job || job.clientId !== session.user.id) notFound();

  if (job.status === MarketplaceJobStatus.FUNDED) {
    redirect(`/customer/jobs/${job.id}?paid=1`);
  }

  if (job.status !== MarketplaceJobStatus.AWAITING_PAYMENT) {
    redirect(`/customer/jobs/${job.id}`);
  }

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
          {job.protectionStatus === "PROTECTED"
            ? "Protected job — funds held until you confirm completion."
            : "Unprotected job — funds released at job start per platform rules."}
        </p>
      </div>

      {sp.paid === "1" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Payment submitted. Final status updates when Stripe confirms via webhook.
        </div>
      )}

      <JobCheckout jobId={job.id} publishableKey={getStripePublishableKey()} />
    </div>
  );
}
