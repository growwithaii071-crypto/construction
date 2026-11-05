"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertCircle, Percent, Shield, Table2 } from "lucide-react";
import { savePricingConfigAction } from "@/actions/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  smallLeadMin: number;
  smallLeadMax: number;
  smallLeadDefault: number;
  mediumLeadMin: number;
  mediumLeadMax: number;
  mediumLeadDefault: number;
  largeLeadMin: number;
  largeLeadMax: number;
  largeLeadDefault: number;
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

      {/* Lead price bands */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Table2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Lead price by job size (+VAT)</h2>
            <p className="text-sm text-slate-500">
              Max traders per lead is set below (default 3). Charge uses each band&apos;s default
              when fee type is Lead by size.
            </p>
          </div>
        </div>

        <p className="mb-4 text-xs font-semibold text-slate-500">
          Currency locked to <span className="text-[#0B2A4A]">£ GBP</span> for the whole platform.
        </p>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="smallBudgetMax">Small under (budget £)</Label>
            <Input
              id="smallBudgetMax"
              name="smallBudgetMax"
              type="number"
              min={0}
              step="1"
              defaultValue={initial.smallBudgetMax}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mediumBudgetMax">Medium under (budget £)</Label>
            <Input
              id="mediumBudgetMax"
              name="mediumBudgetMax"
              type="number"
              min={0}
              step="1"
              defaultValue={initial.mediumBudgetMax}
              className="h-11 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Job size</th>
                <th className="px-3 py-2.5">Examples</th>
                <th className="px-3 py-2.5">Lead min</th>
                <th className="px-3 py-2.5">Lead max</th>
                <th className="px-3 py-2.5">Charge (default)</th>
                <th className="px-3 py-2.5">Max traders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <LeadRow
                size="Small (under band)"
                examples="Roof repair, gutters, small plastering"
                minName="smallLeadMin"
                maxName="smallLeadMax"
                defName="smallLeadDefault"
                min={initial.smallLeadMin}
                max={initial.smallLeadMax}
                def={initial.smallLeadDefault}
                maxTraders={initial.matchingInviteCount}
              />
              <LeadRow
                size="Medium"
                examples="Bathroom, kitchen fitting, garage conversion, re-roof part"
                minName="mediumLeadMin"
                maxName="mediumLeadMax"
                defName="mediumLeadDefault"
                min={initial.mediumLeadMin}
                max={initial.mediumLeadMax}
                def={initial.mediumLeadDefault}
                maxTraders={initial.matchingInviteCount}
              />
              <LeadRow
                size="Large"
                examples="Loft conversion, extension, full kitchen, full new roof"
                minName="largeLeadMin"
                maxName="largeLeadMax"
                defName="largeLeadDefault"
                min={initial.largeLeadMin}
                max={initial.largeLeadMax}
                def={initial.largeLeadDefault}
                maxTraders={initial.matchingInviteCount}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Trader success fee mode */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Percent className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Trader fee model</h2>
            <p className="text-sm text-slate-500">
              Lead by size uses the table above. Deducted at payout when the quote is accepted.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Fee type</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "LEAD_BY_SIZE", label: "Lead by job size (new)" },
                  { value: "PERCENTAGE", label: "Percentage" },
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

          {feeType === "PERCENTAGE" && (
            <>
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
              <div className="space-y-1.5">
                <Label htmlFor="traderFeeCap">
                  Cap <span className="font-normal text-slate-400">optional</span>
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
            </>
          )}

          {feeType === "FIXED" && (
            <div className="space-y-1.5">
              <Label htmlFor="traderFeeRate">Fixed fee</Label>
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
              <input type="hidden" name="traderFeeCap" value="" />
            </div>
          )}

          {feeType === "LEAD_BY_SIZE" && (
            <>
              <input type="hidden" name="traderFeeRate" value="0" />
              <input type="hidden" name="traderFeeCap" value="" />
              <p className="sm:col-span-2 text-sm text-slate-600">
                Trader fee = lead default for the job&apos;s size band (Small / Medium / Large).
              </p>
            </>
          )}
        </div>
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
            />
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
              <option value="OPT_OUT">Ticked (opt-out)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Matching & timing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-bold text-slate-900">Matching & release rules</h2>
        <p className="mb-5 text-sm text-slate-500">
          Max traders per lead applies to every job size (your table uses 3).
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id="matchingInviteCount"
            label="Max traders per lead"
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

function LeadRow({
  size,
  examples,
  minName,
  maxName,
  defName,
  min,
  max,
  def,
  maxTraders,
}: {
  size: string;
  examples: string;
  minName: string;
  maxName: string;
  defName: string;
  min: number;
  max: number;
  def: number;
  maxTraders: number;
}) {
  return (
    <tr className="align-top">
      <td className="px-3 py-3 font-semibold text-slate-900">{size}</td>
      <td className="max-w-[220px] px-3 py-3 text-xs text-slate-500">{examples}</td>
      <td className="px-3 py-3">
        <Input
          name={minName}
          type="number"
          min={0}
          step="0.5"
          defaultValue={min}
          className="h-9 w-24 rounded-lg"
          required
        />
      </td>
      <td className="px-3 py-3">
        <Input
          name={maxName}
          type="number"
          min={0}
          step="0.5"
          defaultValue={max}
          className="h-9 w-24 rounded-lg"
          required
        />
      </td>
      <td className="px-3 py-3">
        <Input
          name={defName}
          type="number"
          min={0}
          step="0.5"
          defaultValue={def}
          className="h-9 w-24 rounded-lg"
          required
        />
      </td>
      <td className="px-3 py-3 text-slate-600">{maxTraders}</td>
    </tr>
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
