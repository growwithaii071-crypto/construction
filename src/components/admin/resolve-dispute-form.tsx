"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resolveDisputeAction } from "@/actions/marketplace/disputes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ResolveDisputeForm({
  disputeId,
  quoteAmount,
}: {
  disputeId: string;
  quoteAmount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("FULL_RELEASE");
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    fd.set("disputeId", disputeId);
    startTransition(async () => {
      const res = await resolveDisputeAction(fd);
      setMessage(res.message);
      if (res.success) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">Resolve dispute</h3>

      <div className="space-y-2">
        {(
          [
            { value: "FULL_RELEASE", label: "Full release to trader" },
            { value: "PARTIAL_RELEASE", label: "Partial release" },
            { value: "REFUNDED", label: "Full refund to customer" },
          ] as const
        ).map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="resolution"
              value={opt.value}
              checked={resolution === opt.value}
              onChange={() => setResolution(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {resolution === "PARTIAL_RELEASE" && (
        <div className="space-y-1.5">
          <Label htmlFor="traderAmount">Amount to trader (₹)</Label>
          <Input
            id="traderAmount"
            name="traderAmount"
            type="number"
            min={0}
            max={quoteAmount}
            step="1"
            defaultValue={Math.round(quoteAmount / 2)}
            className="h-11 rounded-xl"
            required
          />
          <p className="text-xs text-slate-400">
            Quote ₹{quoteAmount.toLocaleString("en-IN")} — remainder (+ protection fee) refunded to customer
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Resolution notes for audit…"
        />
      </div>

      {message && <p className="text-sm text-slate-700">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Apply resolution
      </button>
    </form>
  );
}
