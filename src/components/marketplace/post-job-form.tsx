"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, ClipboardList } from "lucide-react";
import { createJobAction } from "@/actions/marketplace/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PostJobForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createJobAction(fd);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setSuccess(res.message);
      router.push(`/customer/jobs/${res.jobId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Job title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Fix leaking bathroom tap"
          className="h-11 rounded-xl"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Trade / category</Label>
          <select
            id="category"
            name="category"
            required
            disabled={pending}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select a trade
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="City / area"
            className="h-11 rounded-xl"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="What needs doing? Size, materials, access, urgency…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="budgetMin">Budget min (₹)</Label>
          <Input
            id="budgetMin"
            name="budgetMin"
            type="number"
            min={0}
            placeholder="Optional"
            className="h-11 rounded-xl"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budgetMax">Budget max (₹)</Label>
          <Input
            id="budgetMax"
            name="budgetMax"
            type="number"
            min={0}
            placeholder="Optional"
            className="h-11 rounded-xl"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photos">
          Photo URLs <span className="font-normal text-slate-400">(one per line, optional)</span>
        </Label>
        <textarea
          id="photos"
          name="photos"
          rows={2}
          placeholder="https://…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          disabled={pending}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className={cn(
          "h-12 w-full rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600 sm:w-auto sm:px-8"
        )}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Finding traders…
          </>
        ) : (
          <>
            <ClipboardList className="mr-2 h-4 w-4" />
            Post job &amp; invite 3 traders
          </>
        )}
      </Button>
    </form>
  );
}
