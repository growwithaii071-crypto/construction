import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus } from "@/generated/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  ExternalLink,
  Landmark,
  BadgeIndianRupee,
  Webhook,
  KeyRound,
  Users,
  Wallet,
} from "lucide-react";
import { getStripeEnvStatus, computeVerified } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stripe / Payments" };

export default async function StripeSettingsPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const [env, contractors, payoutAgg, feePending, jobsFunded, jobsDisputed] =
    await Promise.all([
      getStripeEnvStatus(),
      prisma.user.findMany({
        where: { role: UserRole.CONTRACTOR, isActive: true },
        select: {
          stripeAccountId: true,
          stripeOnboardingDone: true,
          stripePayoutsEnabled: true,
          feePaymentMethodId: true,
        },
      }),
      prisma.payout.aggregate({
        _count: true,
        _sum: { netAmount: true },
      }),
      prisma.feeLedger.aggregate({
        where: { status: "PENDING" },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.marketplaceJob.count({
        where: {
          status: {
            in: [
              MarketplaceJobStatus.FUNDED,
              MarketplaceJobStatus.IN_PROGRESS,
              MarketplaceJobStatus.COMPLETED,
            ],
          },
        },
      }),
      prisma.marketplaceJob.count({
        where: { status: MarketplaceJobStatus.DISPUTED },
      }),
    ]);

  const withConnect = contractors.filter((c) => c.stripeAccountId).length;
  const verified = contractors.filter((c) =>
    computeVerified({
      onboardingDone: c.stripeOnboardingDone,
      payoutsEnabled: c.stripePayoutsEnabled,
      feePaymentMethodId: c.feePaymentMethodId,
    })
  ).length;

  const ready =
    env.secretConfigured &&
    env.publishableConfigured &&
    env.webhookConfigured &&
    env.apiOk === true;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Stripe / Payments
              </h1>
              <p className="text-sm text-slate-500">
                Platform keys, webhook endpoint, and Connect trader status — keys stay in
                environment variables
              </p>
            </div>
          </div>
          <StatusPill
            ok={ready}
            label={
              ready
                ? "Ready for payments"
                : env.apiOk === false
                  ? "Stripe API error"
                  : "Setup incomplete"
            }
          />
        </div>
      </div>

      {/* Env checklist */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <KeyRound className="h-4 w-4 text-slate-400" />
          Environment (Vercel / .env)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Secrets are never editable here. Update them in Vercel → Environment Variables, then
          redeploy.
        </p>
        <ul className="mt-4 space-y-3">
          <EnvRow
            label="STRIPE_SECRET_KEY"
            ok={env.secretConfigured}
            masked={env.secretMasked}
            hint="Platform account — receives customer payments & keeps fees"
          />
          <EnvRow
            label="STRIPE_PUBLISHABLE_KEY"
            ok={env.publishableConfigured}
            masked={env.publishableMasked}
            hint="pk_test_… / pk_live_… — Sensitive OK on Vercel (no NEXT_PUBLIC_ prefix)"
          />
          <EnvRow
            label="STRIPE_WEBHOOK_SECRET"
            ok={env.webhookConfigured}
            masked={env.webhookMasked}
            hint="Signing secret from Stripe webhook endpoint (whsec_…)"
          />
          <EnvRow
            label="NEXT_PUBLIC_APP_URL"
            ok={Boolean(env.appUrl) && !/localhost|127\.0\.0\.1/i.test(env.appUrl)}
            masked={env.appUrl}
            hint="Set to https://construction-nine-red.vercel.app on Vercel (no trailing slash). Localhost here breaks live webhooks/Connect."
          />
        </ul>

        {env.apiOk === true && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Stripe API connected</p>
            <p className="mt-1 text-xs text-emerald-800/90">
              Secret key can reach Stripe · {env.livemode ? "Live mode" : "Test mode"}
            </p>
          </div>
        )}
        {env.apiOk === false && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
            <p className="font-semibold">Could not call Stripe</p>
            <p className="mt-1 text-xs text-rose-800/90">{env.apiError}</p>
          </div>
        )}
      </section>

      {/* Webhook */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Webhook className="h-4 w-4 text-slate-400" />
          Webhook endpoint
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Stripe Dashboard → Developers → Webhooks → Add endpoint. Use this exact URL:
        </p>
        <code className="mt-3 block break-all rounded-xl bg-slate-900 px-4 py-3 text-xs text-emerald-300">
          {env.webhookEndpointUrl}
        </code>
        <p className="mt-3 text-xs text-slate-500">
          Events:{" "}
          <span className="font-medium text-slate-700">
            payment_intent.succeeded, payment_intent.payment_failed, charge.refunded,
            account.updated, setup_intent.succeeded
          </span>
        </p>
        <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <UrlHint label="Connect return" value={env.connectReturnUrl} />
          <UrlHint label="Connect refresh" value={env.connectRefreshUrl} />
        </div>
      </section>

      {/* Marketplace money ops */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Verified traders"
          value={`${verified} / ${contractors.length}`}
          hint={`${withConnect} with Connect account`}
        />
        <StatCard
          icon={Wallet}
          label="Escrow in progress"
          value={String(jobsFunded)}
          hint="Funded / in progress / completed"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open disputes"
          value={String(jobsDisputed)}
          hint="Payouts blocked until resolve"
          href="/disputes"
        />
        <StatCard
          icon={Landmark}
          label="Payouts released"
          value={String(payoutAgg._count)}
          hint={
            payoutAgg._sum.netAmount != null
              ? `₹${payoutAgg._sum.netAmount.toLocaleString("en-IN")} net to traders`
              : "No transfers yet"
          }
        />
      </section>

      {(feePending._count ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            Pending trader success fees: {feePending._count} · ₹
            {(feePending._sum.amount ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-0.5 text-xs text-amber-800/90">
            These collect when jobs pay out (quote − fee stays on the platform Stripe balance).
          </p>
        </div>
      )}

      {/* Actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/settings/pricing"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <BadgeIndianRupee className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Marketplace pricing</p>
            <p className="text-xs text-slate-500">
              Success fee %, protection fee, matching rules
            </p>
          </div>
        </Link>
        <a
          href="https://dashboard.stripe.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ExternalLink className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Open Stripe Dashboard</p>
            <p className="text-xs text-slate-500">
              Balances, webhooks, Connect accounts, payouts
            </p>
          </div>
        </a>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Marketplace cron</p>
        <p className="mt-1">
          Hourly job: invite expiry, quote expiry, auto-confirm payouts →{" "}
          <code className="rounded bg-white px-1">GET /api/cron/marketplace</code> with{" "}
          <code className="rounded bg-white px-1">Authorization: Bearer CRON_SECRET</code>. Set{" "}
          <code className="rounded bg-white px-1">CRON_SECRET</code> on Vercel (same value Vercel
          Cron uses).
        </p>
      </div>

      <p className="text-xs text-slate-400">
        Contractors complete Connect + fee card themselves at{" "}
        <code className="rounded bg-slate-100 px-1">/construction/payouts</code>. Customers pay
        at job checkout. Platform fees remain on the Stripe account tied to{" "}
        <code className="rounded bg-slate-100 px-1">STRIPE_SECRET_KEY</code>.
      </p>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function EnvRow({
  label,
  ok,
  masked,
  hint,
}: {
  label: string;
  ok: boolean;
  masked: string | null;
  hint: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <code className="text-xs font-semibold text-slate-800">{label}</code>
          <span className="truncate font-mono text-[11px] text-slate-500">
            {masked ?? "not set"}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
      </div>
    </li>
  );
}

function UrlHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="mt-0.5 break-all font-mono text-[10px] text-slate-500">{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-[#0B2A4A]">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{body}</div>
  );
}
