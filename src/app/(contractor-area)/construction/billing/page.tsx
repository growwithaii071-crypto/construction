import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { getBillingStatusAction } from "@/actions/marketplace/billing";
import { getStripePublishableKey } from "@/lib/stripe";
import { BillingPanel } from "@/components/contractor/billing-panel";
import { FlowBadge } from "@/components/marketplace/flow-badge";
import { formatMoney } from "@/lib/money";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits & plans — BuildPro" };

export default async function ContractorBillingPage() {
  await requireAuth([UserRole.CONTRACTOR]);
  const status = await getBillingStatusAction();
  const publishableKey = getStripePublishableKey();

  if (!status.success) {
    return <p className="p-6 text-sm text-red-600">Could not load billing.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
      <div>
        <FlowBadge flow="marketplace" className="mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">Credits & plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          Buy credits or subscribe to submit quotes. When a customer accepts, pay platform
          commission — we issue an invoice.
        </p>
      </div>

      <BillingPanel
        publishableKey={publishableKey}
        credits={status.access.credits}
        subscribed={status.access.subscribed}
        subscriptionEndsAt={status.access.subscriptionEndsAt?.toISOString() ?? null}
        packPrice={status.packs.price}
        packSize={status.packs.size}
        subPrice={status.subscription.price}
        subDays={status.subscription.days}
        commissionRate={status.commissionRate}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Invoices</h2>
        {status.invoices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {status.invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{inv.invoiceNo}</p>
                  <p className="text-xs text-slate-500">{inv.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0B2A4A]">{formatMoney(inv.amount)}</p>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">
                    {inv.status} · {inv.kind}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
