"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertCircle, Percent, Shield } from "lucide-react";
import { savePricingConfigAction } from "@/actions/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PricingFormInitial = {
  traderFeeType: "PERCENTAGE" | "FIXED";
  traderFeeRatePct: number;
  traderFeeFixed: number;
  traderFeeCap: number | null;
  protectionFeeEnabled: boolean;
  protectionFeeRatePct: number;
  protectionFeeDefault: "OPT_IN" | "OPT_OUT";
  unprotectedReleaseAt: "JOB_START" | "COMPLETION";
  quoteValidDays: number;
  invitationExpiryHours: number;
  autoConfirmDays: number;
  matchingInviteCount: number;
  maxReassignments: number;
  termsVersion: string;
};

export function PricingConfigForm({ initial }: { initial: PricingFormInitial }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [feeType, setFeeType] = useState(initial.traderFeeType);
  const [protectionOn, setProtectionOn] = useState(initial.protectionFeeEnabled);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await savePricingConfigAction(fd);
      setMessage({ ok: res.success, text: res.message });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {message && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Trader success fee */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Percent className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Trader success fee</h2>
            <p className="text-sm text-slate-500">
              Charged only when the customer accepts their quote. Deducted at payout.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Fee type</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "PERCENTAGE", label: "Percentage (recommended)" },
                  { value: "FIXED", label: "Fixed amount" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    feeType === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-800"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="traderFeeType"
                    value={opt.value}
                    checked={feeType === opt.value}
                    onChange={() => setFeeType(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {feeType === "PERCENTAGE" ? (
            <div className="space-y-1.5">
              <Label htmlFor="traderFeeRate">Rate (%)</Label>
              <Input
                id="traderFeeRate"
                name="traderFeeRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                defaultValue={initial.traderFeeRatePct}
                className="h-11 rounded-xl"
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="traderFeeRate">Fixed fee (₹)</Label>
              <Input
                id="traderFeeRate"
                name="traderFeeRate"
                type="number"
                step="1"
                min="0"
                defaultValue={initial.traderFeeFixed}
                className="h-11 rounded-xl"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="traderFeeCap">
              Cap (₹) <span className="font-normal text-slate-400">optional</span>
            </Label>
            <Input
              id="traderFeeCap"
              name="traderFeeCap"
              type="number"
              step="1"
              min="0"
              defaultValue={initial.traderFeeCap ?? ""}
              placeholder="No cap"
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Protection fee */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Customer payment protection</h2>
            <p className="text-sm text-slate-500">
              Shown side-by-side at checkout. Server calculates totals — never trust the client.
            </p>
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            name="protectionFeeEnabled"
            checked={protectionOn}
            onChange={(e) => setProtectionOn(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm font-semibold text-slate-800">Enable protection fee option</span>
        </label>

        <div className={cn("grid gap-4 sm:grid-cols-2", !protectionOn && "opacity-50")}>
          <div className="space-y-1.5">
            <Label htmlFor="protectionFeeRate">Protection fee (%)</Label>
            <Input
              id="protectionFeeRate"
              name="protectionFeeRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={initial.protectionFeeRatePct}
              disabled={!protectionOn}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-slate-400">Recommended 2–5%</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="protectionFeeDefault">Default at checkout</Label>
            <select
              id="protectionFeeDefault"
              name="protectionFeeDefault"
              defaultValue={initial.protectionFeeDefault}
              disabled={!protectionOn}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="OPT_IN">Unticked (opt-in) — recommended</option>
              <option value="OPT_OUT">Ticked (opt-out) — show fee line clearly</option>
            </select>
          </div>
        </div>
      </section>

      {/* Matching & timing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-bold text-slate-900">Matching & release rules</h2>
        <p className="mb-5 text-sm text-slate-500">Controls invitations, quote validity and payout timing.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id="matchingInviteCount"
            label="Traders invited"
            defaultValue={initial.matchingInviteCount}
          />
          <Field
            id="maxReassignments"
            label="Max reassignments"
            defaultValue={initial.maxReassignments}
          />
          <Field
            id="invitationExpiryHours"
            label="Invite expiry (hours)"
            defaultValue={initial.invitationExpiryHours}
          />
          <Field
            id="quoteValidDays"
            label="Quote valid (days)"
            defaultValue={initial.quoteValidDays}
          />
          <Field
            id="autoConfirmDays"
            label="Auto-confirm (days)"
            defaultValue={initial.autoConfirmDays}
          />

          <div className="space-y-1.5">
            <Label htmlFor="unprotectedReleaseAt">Unprotected release</Label>
            <select
              id="unprotectedReleaseAt"
              name="unprotectedReleaseAt"
              defaultValue={initial.unprotectedReleaseAt}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="JOB_START">At job start (recommended)</option>
              <option value="COMPLETION">At completion</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="termsVersion">Terms version (recorded on payment)</Label>
            <Input
              id="termsVersion"
              name="termsVersion"
              defaultValue={initial.termsVersion}
              className="h-11 max-w-xs rounded-xl"
              required
            />
          </div>
        </div>
      </section>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-orange-500 px-6 font-bold text-white hover:bg-orange-600"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save pricing config"
        )}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        min={0}
        defaultValue={defaultValue}
        className="h-11 rounded-xl"
        required
      />
    </div>
  );
}
