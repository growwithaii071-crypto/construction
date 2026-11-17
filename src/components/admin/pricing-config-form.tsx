"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertCircle, Shield, Table2 } from "lucide-react";
import { savePricingConfigAction } from "@/actions/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SuccessFeeTier } from "@/lib/pricing";
import { MONEY_SYMBOL } from "@/lib/money";

export type PricingFormInitial = {
  traderFeeType: "PERCENTAGE" | "FIXED" | "LEAD_BY_SIZE";
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
  smallBudgetMax: number;
  mediumBudgetMax: number;
  successFeeTiers: SuccessFeeTier[];
};

export function PricingConfigForm({ initial }: { initial: PricingFormInitial }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [protectionOn, setProtectionOn] = useState(initial.protectionFeeEnabled);
  const [tiers, setTiers] = useState<SuccessFeeTier[]>(initial.successFeeTiers);
  const sym = MONEY_SYMBOL;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    fd.set("successFeeTiers", JSON.stringify(tiers));
    startTransition(async () => {
      const res = await savePricingConfigAction(fd);
      setMessage({ ok: res.success, text: res.message });
    });
  }

  function updateTier(index: number, patch: Partial<SuccessFeeTier>) {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
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

      {/* Success fee by job value */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Table2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Success fee by job value</h2>
            <p className="text-sm text-slate-500">
              Fixed trader success fee charged when a quote is won. Currency locked to{" "}
              <span className="font-semibold text-[#0B2A4A]">£ GBP</span>.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Job value (from £)</th>
                <th className="px-3 py-2.5">Job value (to £)</th>
                <th className="px-3 py-2.5">Success fee (£)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tiers.map((tier, i) => (
                <tr key={i}>
                  <td className="px-3 py-2.5">
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={tier.min}
                      onChange={(e) =>
                        updateTier(i, { min: Number(e.target.value) || 0 })
                      }
                      className="h-10 rounded-lg"
                      required
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {tier.max == null ? (
                      <span className="text-sm font-medium text-slate-600">
                        {sym}
                        {tier.min.toLocaleString("en-GB")}+ (open)
                      </span>
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={tier.max}
                        onChange={(e) =>
                          updateTier(i, {
                            max: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-10 rounded-lg"
                        required
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={tier.fee}
                      onChange={(e) =>
                        updateTier(i, { fee: Number(e.target.value) || 0 })
                      }
                      className="h-10 rounded-lg font-semibold"
                      required
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 max-w-xs space-y-1.5">
          <Label htmlFor="matchingInviteCountTop">Max traders per lead</Label>
          <Input
            id="matchingInviteCountTop"
            name="matchingInviteCount"
            type="number"
            min={1}
            max={10}
            defaultValue={initial.matchingInviteCount}
            className="h-11 rounded-xl font-semibold"
            required
          />
          <p className="text-xs text-slate-400">
            How many traders get invited to each job (shown on every band above).
          </p>
        </div>
        {/* Always charge by job-value success fee table */}
        <input type="hidden" name="traderFeeType" value="LEAD_BY_SIZE" />
        <input type="hidden" name="traderFeeRate" value="0" />
        <input type="hidden" name="traderFeeCap" value="" />
        <input type="hidden" name="smallBudgetMax" value={initial.smallBudgetMax} />
        <input type="hidden" name="mediumBudgetMax" value={initial.mediumBudgetMax} />
      </section>

      {/* Protection fee */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
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
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="protectionFeeDefault">Default mode</Label>
            <select
              id="protectionFeeDefault"
              name="protectionFeeDefault"
              defaultValue={initial.protectionFeeDefault}
              disabled={!protectionOn}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="OPT_IN">Opt-in</option>
              <option value="OPT_OUT">Opt-out (on by default)</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="unprotectedReleaseAt">Unprotected release timing</Label>
            <select
              id="unprotectedReleaseAt"
              name="unprotectedReleaseAt"
              defaultValue={initial.unprotectedReleaseAt}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="JOB_START">At job start</option>
              <option value="COMPLETION">At completion</option>
            </select>
          </div>
        </div>
      </section>

      {/* Ops */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-900">Marketplace timing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="quoteValidDays">Quote valid (days)</Label>
            <Input
              id="quoteValidDays"
              name="quoteValidDays"
              type="number"
              min={1}
              max={90}
              defaultValue={initial.quoteValidDays}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invitationExpiryHours">Invitation expiry (hours)</Label>
            <Input
              id="invitationExpiryHours"
              name="invitationExpiryHours"
              type="number"
              min={1}
              max={168}
              defaultValue={initial.invitationExpiryHours}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="autoConfirmDays">Auto-confirm (days)</Label>
            <Input
              id="autoConfirmDays"
              name="autoConfirmDays"
              type="number"
              min={1}
              max={30}
              defaultValue={initial.autoConfirmDays}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxReassignments">Max reassignments</Label>
            <Input
              id="maxReassignments"
              name="maxReassignments"
              type="number"
              min={0}
              max={50}
              defaultValue={initial.maxReassignments}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="termsVersion">Terms version</Label>
            <Input
              id="termsVersion"
              name="termsVersion"
              defaultValue={initial.termsVersion}
              className="h-11 rounded-xl"
              required
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-xl bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save pricing"
          )}
        </Button>
      </div>
    </form>
  );
}
