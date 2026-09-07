"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/customer/services?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/customer/services");
    }
  }

  return (
    <form onSubmit={handleSearch} className="mt-8 max-w-105">
      <label className="block text-white/70 text-sm font-medium mb-2">
        What&apos;s your job?
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. House construction, plumber..."
            className="w-full h-12 pl-10 pr-4 bg-white rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-lg shadow-violet-700/30"
        >
          Get quotes
        </button>
      </div>
      <p className="mt-2.5 text-xs text-white/30">
        Free to post · No obligation · Replies in hours
      </p>
    </form>
  );
}
