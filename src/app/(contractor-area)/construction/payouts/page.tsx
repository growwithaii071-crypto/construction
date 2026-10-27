import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { getConnectStatusAction } from "@/actions/stripe/connect";
import { getStripePublishableKey } from "@/lib/stripe";
import { ConnectOnboarding } from "@/components/contractor/connect-onboarding";
import { BadgeCheck, Landmark } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payouts & Verification — BuildPro" };

export default async function ContractorPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string; fee?: string; error?: string }>;
}) {
  await requireAuth([UserRole.CONTRACTOR]);
  const params = await searchParams;

  // Returning from Stripe — sync latest account status
  const status = await getConnectStatusAction();
  const publishableKey = getStripePublishableKey();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
          <Landmark className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payouts & verification</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete Stripe Connect to get verified, receive job invites, and get paid safely
          </p>
        </div>
      </div>

      {(params.connect === "return" || params.fee === "return") && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <BadgeCheck className="h-4 w-4" />
          Returned from Stripe — status refreshed below.
        </div>
      )}

      {params.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong ({params.error}). Try again or contact support.
        </div>
      )}

      <ConnectOnboarding initial={status} publishableKey={publishableKey} />
    </div>
  );
}
