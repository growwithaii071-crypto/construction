import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  MarketplacePaymentStatus,
  FeeLedgerStatus,
  PayoutTransferStatus,
  DisputeStatus,
  CreditPurchaseStatus,
  PlatformInvoiceStatus,
} from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/lib/money";
import { RefundPaymentButton } from "@/components/admin/refund-payment-button";
import {
  CreditCard,
  ArrowLeftRight,
  Scale,
  BadgePercent,
  Users,
  Ticket,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transactions — BuildPro Admin" };

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  stripeCustomerId: true,
  stripeAccountId: true,
  stripeOnboardingDone: true,
  stripePayoutsEnabled: true,
  quoteCredits: true,
  createdAt: true,
} as const;

type Tab = "payments" | "commissions" | "payouts" | "credits" | "invoices";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "commissions" ||
    sp.tab === "payouts" ||
    sp.tab === "credits" ||
    sp.tab === "invoices"
      ? sp.tab
      : "payments";

  const [
    payments,
    commissions,
    payouts,
    creditPurchases,
    platformInvoices,
    openDisputes,
    paymentCount,
  ] = await Promise.all([
    prisma.marketplacePayment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            location: true,
            protectionStatus: true,
            client: { select: userSelect },
          },
        },
        quote: {
          select: {
            id: true,
            amount: true,
            status: true,
            trader: { select: userSelect },
          },
        },
      },
    }),
    prisma.feeLedger.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trader: { select: userSelect },
        quote: {
          select: {
            id: true,
            amount: true,
            job: {
              select: {
                id: true,
                title: true,
                status: true,
                client: { select: userSelect },
              },
            },
          },
        },
      },
    }),
    prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trader: { select: userSelect },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            client: { select: userSelect },
          },
        },
      },
    }),
    prisma.creditPurchase.findMany({
      orderBy: { createdAt: "desc" },
      include: { trader: { select: userSelect } },
    }),
    prisma.platformInvoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { trader: { select: userSelect } },
    }),
    prisma.dispute.count({
      where: {
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      },
    }),
    prisma.marketplacePayment.count(),
  ]);

  const paidSum = payments
    .filter((p) => p.status === MarketplacePaymentStatus.SUCCEEDED)
    .reduce((s, p) => s + p.customerTotal, 0);
  const commissionSum = commissions
    .filter((c) => c.status === FeeLedgerStatus.COLLECTED)
    .reduce((s, c) => s + c.amount, 0);
  const payoutSum = payouts
    .filter((p) => p.status !== PayoutTransferStatus.FAILED)
    .reduce((s, p) => s + p.netAmount, 0);
  const creditsSum = creditPurchases
    .filter((c) => c.status === CreditPurchaseStatus.SUCCEEDED)
    .reduce((s, c) => s + c.amount, 0);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "payments", label: "Payments", count: paymentCount },
    { id: "commissions", label: "Commission", count: commissions.length },
    { id: "payouts", label: "Transfers", count: payouts.length },
    { id: "credits", label: "Credit packs", count: creditPurchases.length },
    { id: "invoices", label: "Invoices", count: platformInvoices.length },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full payment list with homeowner + trader details, Stripe IDs, refunds, and
            Connect transfers.
          </p>
        </div>
        <Link
          href="/disputes"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Scale className="h-4 w-4" />
          Disputes ({openDisputes} open)
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<CreditCard className="h-4 w-4" />}
          label="Succeeded payments"
          value={formatMoney(paidSum)}
          sub={`${payments.filter((p) => p.status === "SUCCEEDED").length} of ${payments.length}`}
        />
        <Stat
          icon={<BadgePercent className="h-4 w-4" />}
          label="Commission collected"
          value={formatMoney(commissionSum)}
        />
        <Stat
          icon={<ArrowLeftRight className="h-4 w-4" />}
          label="Transfers to traders"
          value={formatMoney(payoutSum)}
        />
        <Stat
          icon={<Ticket className="h-4 w-4" />}
          label="Credit pack sales"
          value={formatMoney(creditsSum)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/transactions?tab=${t.id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? "bg-[#0B2A4A] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label} ({t.count})
          </Link>
        ))}
      </div>

      {tab === "payments" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Users className="h-4 w-4 text-orange-500" />
              All homeowner payments ({payments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Customer, trader, amounts, protection, Stripe session / PaymentIntent
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Job</th>
                  <th className="px-4 py-2 font-semibold">Homeowner (customer)</th>
                  <th className="px-4 py-2 font-semibold">Trader</th>
                  <th className="px-4 py-2 font-semibold">Amounts</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Stripe</th>
                  <th className="px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const customer = p.job.client;
                    const trader = p.quote.trader;
                    return (
                      <tr key={p.id} className="align-top">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(p.createdAt)}
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {p.id.slice(-8)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/customer/jobs/${p.job.id}`}
                            className="font-semibold text-[#0B2A4A] hover:underline"
                          >
                            {p.job.title}
                          </Link>
                          <p className="text-[11px] text-slate-400">
                            {p.job.category}
                            {p.job.location ? ` · ${p.job.location}` : ""}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Job {p.job.status.replaceAll("_", " ")} · protect{" "}
                            {p.job.protectionStatus}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <UserCell user={customer} kind="customer" />
                        </td>
                        <td className="px-4 py-3">
                          <UserCell user={trader} kind="trader" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-bold text-slate-900">
                            {formatMoney(p.customerTotal)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Quote {formatMoney(p.quoteAmount)}
                          </p>
                          {p.protectionOptedIn && (
                            <p className="text-[11px] text-blue-700">
                              Protect +{formatMoney(p.protectionFee)}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Terms {p.termsVersion}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500 max-w-[200px] break-all">
                          {p.stripeCheckoutSessionId && (
                            <p title={p.stripeCheckoutSessionId}>
                              cs: {p.stripeCheckoutSessionId}
                            </p>
                          )}
                          {p.stripePaymentIntentId && (
                            <p title={p.stripePaymentIntentId}>
                              pi: {p.stripePaymentIntentId}
                            </p>
                          )}
                          {!p.stripeCheckoutSessionId && !p.stripePaymentIntentId && "—"}
                        </td>
                        <td className="px-4 py-3">
                          <RefundPaymentButton
                            paymentId={p.id}
                            disabled={
                              p.status !== MarketplacePaymentStatus.SUCCEEDED &&
                              p.status !== MarketplacePaymentStatus.PARTIALLY_REFUNDED
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "commissions" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Platform commission ({commissions.length})
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Job</th>
                  <th className="px-4 py-2 font-semibold">Homeowner</th>
                  <th className="px-4 py-2 font-semibold">Trader</th>
                  <th className="px-4 py-2 font-semibold">Fee</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Stripe PI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No commission rows.
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{c.quote.job.title}</p>
                        <p className="text-[11px] text-slate-400">
                          Quote {formatMoney(c.quote.amount)} · job{" "}
                          {c.quote.job.status.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={c.quote.job.client} kind="customer" />
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={c.trader} kind="trader" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold">{formatMoney(c.amount)}</p>
                        {c.rate != null && (
                          <p className="text-[11px] text-slate-400">
                            {(c.rate * 100).toFixed(1)}%
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 break-all">
                        {c.stripePaymentIntentId ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "payouts" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Connect transfers ({payouts.length})
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Job</th>
                  <th className="px-4 py-2 font-semibold">Homeowner</th>
                  <th className="px-4 py-2 font-semibold">Trader + Connect</th>
                  <th className="px-4 py-2 font-semibold">Net</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Transfer ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No transfers yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{p.job.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {p.job.status.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={p.job.client} kind="customer" />
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={p.trader} kind="trader" />
                        {p.failureMessage && (
                          <p className="mt-1 text-xs text-red-600">{p.failureMessage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">
                        {formatMoney(p.netAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 break-all">
                        {p.stripeTransferId ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "credits" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Credit pack purchases ({creditPurchases.length})
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Trader</th>
                  <th className="px-4 py-2 font-semibold">Credits</th>
                  <th className="px-4 py-2 font-semibold">Amount</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Stripe PI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No credit purchases.
                    </td>
                  </tr>
                ) : (
                  creditPurchases.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={c.trader} kind="trader" />
                      </td>
                      <td className="px-4 py-3 font-semibold">{c.credits}</td>
                      <td className="px-4 py-3 font-bold">{formatMoney(c.amount)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 break-all">
                        {c.stripePaymentIntentId ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "invoices" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Platform invoices ({platformInvoices.length})
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Invoice</th>
                  <th className="px-4 py-2 font-semibold">Trader</th>
                  <th className="px-4 py-2 font-semibold">Amount</th>
                  <th className="px-4 py-2 font-semibold">Kind / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No invoices.
                    </td>
                  </tr>
                ) : (
                  platformInvoices.map((inv) => (
                    <tr key={inv.id} className="align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(inv.createdAt)}
                        {inv.paidAt && (
                          <p className="text-[10px] text-emerald-700">
                            paid {fmtDate(inv.paidAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{inv.invoiceNo}</p>
                        <p className="text-[11px] text-slate-500">{inv.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <UserCell user={inv.trader} kind="trader" />
                      </td>
                      <td className="px-4 py-3 font-bold">{formatMoney(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-semibold text-slate-500">
                          {inv.kind}
                        </p>
                        <StatusPill
                          status={
                            inv.status === PlatformInvoiceStatus.PAID
                              ? "SUCCEEDED"
                              : inv.status
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserCell({
  user,
  kind,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    stripeCustomerId?: string | null;
    stripeAccountId?: string | null;
    stripeOnboardingDone?: boolean;
    stripePayoutsEnabled?: boolean;
    quoteCredits?: number;
  };
  kind: "customer" | "trader";
}) {
  const display = user.name.split(" — ")[0] ?? user.name;
  return (
    <div className="max-w-[220px]">
      <Link
        href={`/users/${user.id}/edit`}
        className="font-semibold text-[#0B2A4A] hover:underline"
      >
        {display}
      </Link>
      {!user.isActive && (
        <span className="ml-1 rounded bg-red-50 px-1 text-[10px] font-bold text-red-600">
          inactive
        </span>
      )}
      <p className="text-[11px] text-slate-600 break-all">{user.email}</p>
      {user.phone && <p className="text-[11px] text-slate-500">{user.phone}</p>}
      <p className="font-mono text-[10px] text-slate-400">id {user.id.slice(-8)}</p>
      {kind === "customer" && user.stripeCustomerId && (
        <p className="font-mono text-[10px] text-slate-400 break-all">
          cus {user.stripeCustomerId}
        </p>
      )}
      {kind === "trader" && (
        <>
          {user.stripeAccountId && (
            <p className="font-mono text-[10px] text-slate-400 break-all">
              acct {user.stripeAccountId}
            </p>
          )}
          <p className="text-[10px] text-slate-400">
            Connect {user.stripeOnboardingDone ? "ok" : "pending"}
            {user.stripePayoutsEnabled ? " · payouts on" : " · payouts off"}
            {typeof user.quoteCredits === "number"
              ? ` · ${user.quoteCredits} credits`
              : ""}
          </p>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "SUCCEEDED" || status === "COLLECTED" || status === "PAID"
      ? "bg-emerald-50 text-emerald-800"
      : status === "FAILED" ||
          status === "REFUNDED" ||
          status === "VOIDED" ||
          status === "PARTIALLY_REFUNDED"
        ? "bg-red-50 text-red-700"
        : status === "PENDING" || status === "REQUIRES_ACTION" || status === "ISSUED"
          ? "bg-amber-50 text-amber-800"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
