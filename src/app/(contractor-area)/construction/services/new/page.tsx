"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceAction } from "@/actions/services/create-service";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Residential Construction",
  "Commercial Construction",
  "Industrial Construction",
  "Infrastructure & Civil",
  "Interior Finishing",
  "Electrical Works",
  "Plumbing & Sanitation",
  "Structural Engineering",
  "Renovation & Remodeling",
  "Other",
];

const PRICE_UNITS = [
  "Fixed Price",
  "Per Sq Ft",
  "Per Sq Meter",
  "Per Day",
  "Per Hour",
  "Negotiable",
];

export default function AddServicePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    startTransition(async () => {
      const result = await createServiceAction(data);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/construction/services"), 1500);
      } else {
        setError(result.message);
      }
    });
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Service Added!</h2>
        <p className="text-gray-400 text-sm mt-1">Redirecting to your services…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/construction/services" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
          <p className="text-gray-500 text-sm">Customers will see this and can request it</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Service Title *</label>
          <input
            name="title"
            required
            placeholder="e.g. Full House Construction, Electrical Wiring..."
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select
            name="category"
            required
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Describe what you offer, your experience, work quality, area covered..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Pricing */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Pricing (optional)</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Min Price (₹)</p>
              <input
                name="priceFrom"
                type="number"
                min="0"
                placeholder="e.g. 50000"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Max Price (₹)</p>
              <input
                name="priceTo"
                type="number"
                min="0"
                placeholder="e.g. 200000"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Unit</p>
              <select
                name="priceUnit"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding service…</> : "Add Service"}
        </button>
      </form>
    </div>
  );
}
