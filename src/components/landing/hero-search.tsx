"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Wrench, ChevronDown } from "lucide-react";

const TRADES = [
  "Plumbing & Sanitation",
  "Electrical Works",
  "Painting & Finishing",
  "Roofing & Waterproofing",
  "Interior Finishing",
  "Residential Construction",
  "Commercial Construction",
  "Renovation & Remodeling",
  "Landscaping",
  "HVAC & Ventilation",
];

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Ahmedabad",
  "Jaipur",
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set("search", q);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    const qs = params.toString();
    router.push(`/services${qs ? `?${qs}` : ""}`);
  }

  return (
    <form onSubmit={handleSearch} className="mt-7 w-full max-w-xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/60">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tradesmen (plumber, electrician…)"
            className="h-12 w-full rounded-xl bg-slate-50 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="relative">
            <Wrench className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-600" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-100 bg-slate-50 pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All trades</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-100 bg-slate-50 pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All locations</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
        >
          <Search className="h-4 w-4" />
          Search traders
        </button>
      </div>
      <p className="mt-2.5 text-xs text-slate-400">
        Filter by trade &amp; city · Message after login
      </p>
    </form>
  );
}
