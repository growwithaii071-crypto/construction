"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { submitQuoteAction } from "@/actions/marketplace/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SubmitQuoteForm({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    fd.set("invitationId", invitationId);
    startTransition(async () => {
      const res = await submitQuoteAction(fd);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setSuccess(res.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-900">Submit your quote</h3>
      <p className="text-xs text-slate-500">Nothing is charged when you quote. Fee only if accepted.</p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes("verif") && (
            <Link href="/construction/payouts" className="mt-2 inline-block text-xs font-bold text-orange-700">
              Complete payouts verification →
            </Link>
          )}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Quote amount (₹)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step="1"
          required
          placeholder="25000"
          className="h-11 rounded-xl bg-white"
          disabled={pending || !!success}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startDate">Proposed start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          className="h-11 rounded-xl bg-white"
          disabled={pending || !!success}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scope">Scope / notes</Label>
        <textarea
          id="scope"
          name="scope"
          rows={3}
          placeholder="What’s included, materials, timeline…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          disabled={pending || !!success}
        />
      </div>

      {!success && (
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit quote
            </>
          )}
        </Button>
      )}
    </form>
  );
}
