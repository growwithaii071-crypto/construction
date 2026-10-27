"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Loader2,
  BadgeCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Landmark,
  Shield,
} from "lucide-react";
import {
  startConnectOnboardingAction,
  refreshConnectStatusAction,
} from "@/actions/stripe/connect";
import type { TraderConnectStatus } from "@/lib/stripe";
import { FeeCardSetup } from "@/components/contractor/fee-card-setup";
import { cn } from "@/lib/utils";

export function ConnectOnboarding({
  initial,
  publishableKey,
}: {
  initial: TraderConnectStatus;
  publishableKey: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startOnboarding() {
    setError(null);
    startTransition(async () => {
      const res = await startConnectOnboardingAction();
      if (!res.success) {
        setError(res.message);
        return;
      }
      window.location.href = res.url;
    });
  }

  function refresh() {
    setError(null);
    startTransition(async () => {
      const res = await refreshConnectStatusAction();
      if (!res.success) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  const steps = [
    {
      key: "connect",
      done: status.onboardingDone && status.payoutsEnabled,
      title: "Verify identity & bank",
      desc: "Stripe Connect onboarding — required to receive payouts",
    },
    {
      key: "fee",
      done: status.feeMethodSaved,
      title: "Authorize success fee",
      desc: "Save a card. Nothing charged until a quote is accepted and paid out",
    },
  ];

  return (
    <div className="space-y-6">
      {!status.configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Stripe keys are not set. Add <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code>{" "}
          and <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
          <code className="rounded bg-amber-100 px-1">.env</code>, then restart the server.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Status banner */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4",
          status.verified
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              status.verified ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            {status.verified ? <BadgeCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-bold text-slate-900">
              {status.verified ? "Verified trader" : "Verification incomplete"}
            </p>
            <p className="text-sm text-slate-500">
              {status.verified
                ? "You can receive job invitations and submit quotes"
                : "Complete both steps below to become eligible for matching"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={pending || !status.configured}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
          Refresh status
        </button>
      </div>

      {/* Steps */}
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  step.done ? "bg-emerald-500 text-white" : "bg-[#0B2A4A] text-white"
                )}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            </div>

            {step.key === "connect" && (
              <div className="space-y-3 pl-11">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <StatusChip ok={status.detailsSubmitted} label="Details submitted" />
                  <StatusChip ok={status.chargesEnabled} label="Charges enabled" />
                  <StatusChip ok={status.payoutsEnabled} label="Payouts enabled" />
                </div>
                {status.requirementsDue.length > 0 && (
                  <p className="text-xs text-amber-700">
                    Stripe still needs: {status.requirementsDue.slice(0, 5).join(", ")}
                    {status.requirementsDue.length > 5 ? "…" : ""}
                  </p>
                )}
                {!step.done && (
                  <button
                    type="button"
                    onClick={startOnboarding}
                    disabled={pending || !status.configured}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Landmark className="h-4 w-4" />
                    )}
                    {status.accountId ? "Continue Stripe onboarding" : "Start Stripe Connect"}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </button>
                )}
              </div>
            )}

            {step.key === "fee" && (
              <div className="pl-11">
                <FeeCardSetup
                  publishableKey={publishableKey}
                  alreadySaved={status.feeMethodSaved}
                  onSaved={() => {
                    setStatus((s) => ({
                      ...s,
                      feeMethodSaved: true,
                      verified: s.onboardingDone && s.payoutsEnabled,
                    }));
                    router.refresh();
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-500"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-slate-300")} />
      {label}
    </span>
  );
}
