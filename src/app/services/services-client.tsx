"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, Wrench, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceMCQModal } from "@/components/services/service-mcq-modal";

type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  priceUnit?: string | null;
  requestCount: number;
  contractor: { name: string; avatar?: string | null };
};

const CATEGORY_COLORS: Record<string, string> = {
  "Residential Construction": "bg-blue-100 text-blue-700",
  "Commercial Construction": "bg-purple-100 text-purple-700",
  "Industrial Construction": "bg-gray-100 text-gray-700",
  "Infrastructure & Civil": "bg-teal-100 text-teal-700",
  "Interior Finishing": "bg-pink-100 text-pink-700",
  "Electrical Works": "bg-yellow-100 text-yellow-700",
  "Plumbing & Sanitation": "bg-cyan-100 text-cyan-700",
  "Structural Engineering": "bg-indigo-100 text-indigo-700",
  "Renovation & Remodeling": "bg-orange-100 text-orange-700",
  "Roofing & Waterproofing": "bg-sky-100 text-sky-700",
  "Painting & Finishing": "bg-rose-100 text-rose-700",
  "Landscaping": "bg-green-100 text-green-700",
  "HVAC & Ventilation": "bg-blue-100 text-blue-700",
  "Road & Pavement": "bg-stone-100 text-stone-700",
};

type Props = {
  services: Service[];
  categories: string[];
  searchQuery: string;
  categoryFilter: string;
  isLoggedIn: boolean;
  totalCount: number;
};

export function ServicesClient({
  services,
  categories,
  searchQuery,
  categoryFilter,
  isLoggedIn,
  totalCount,
}: Props) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);

  // After login — check if there's a pending request and auto-open modal
  useEffect(() => {
    const pending = localStorage.getItem("pendingServiceRequest");
    if (pending && isLoggedIn) {
      try {
        const { serviceId } = JSON.parse(pending);
        const svc = services.find((s) => s.id === serviceId);
        if (svc) setSelectedService(svc);
      } catch {
        localStorage.removeItem("pendingServiceRequest");
      }
    }
  }, [isLoggedIn, services]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (categoryFilter) params.set("category", categoryFilter);
    router.push(`/services${params.toString() ? "?" + params.toString() : ""}`);
  }

  function handleCloseModal() {
    setSelectedService(null);
    localStorage.removeItem("pendingServiceRequest");
  }

  const getContractorInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-violet-600 font-extrabold text-lg shrink-0">BuildPro</Link>
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search services, categories, contractors..."
                  className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <button type="submit" className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors">
                Search
              </button>
              {(searchQuery || categoryFilter) && (
                <Link href="/services" className="h-10 px-3 border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm rounded-xl flex items-center gap-1 transition-colors">
                  <X className="w-4 h-4" /> Clear
                </Link>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Active search indicator */}
        {searchQuery && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{services.length}</span> result{services.length !== 1 ? "s" : ""} for
            </span>
            <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-sm font-semibold px-3 py-1 rounded-full">
              <Search className="w-3.5 h-3.5" />
              {searchQuery}
            </span>
            <span className="text-sm text-gray-400">out of {totalCount} services</span>
          </div>
        )}

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={searchQuery ? `/services?search=${encodeURIComponent(searchQuery)}` : "/services"}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                !categoryFilter ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
              )}
            >
              All ({totalCount})
            </Link>
            {categories.map((cat) => {
              const isActive = cat === categoryFilter;
              const href = isActive
                ? searchQuery ? `/services?search=${encodeURIComponent(searchQuery)}` : "/services"
                : searchQuery
                ? `/services?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(cat)}`
                : `/services?category=${encodeURIComponent(cat)}`;
              return (
                <Link key={cat} href={href}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                    isActive ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                  )}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        )}

        {/* Services grid */}
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {searchQuery ? `No results for "${searchQuery}"` : "No services available yet"}
            </h2>
            <p className="text-gray-400 text-sm">
              {searchQuery ? "Try different keywords or browse all services" : "Check back soon!"}
            </p>
            {searchQuery && (
              <Link href="/services" className="mt-4 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700">
                ← Browse all services
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const contractorName = service.contractor.name.split(" — ")[0];
              const initials = getContractorInitials(contractorName);
              return (
                <div key={service.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col"
                  onClick={() => setSelectedService(service)}
                >
                  <div className="p-5 flex-1">
                    {/* Category badge */}
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", CATEGORY_COLORS[service.category] ?? "bg-gray-100 text-gray-600")}>
                      {service.category}
                    </span>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base mt-3 leading-snug">{service.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{service.description}</p>

                    {/* Price */}
                    {(service.priceFrom || service.priceTo) && (
                      <p className="text-sm font-bold text-gray-800 mt-3">
                        ₹{service.priceFrom?.toLocaleString("en-IN")}
                        {service.priceTo && service.priceTo !== service.priceFrom
                          ? ` – ₹${service.priceTo.toLocaleString("en-IN")}` : ""}
                        {service.priceUnit && <span className="text-gray-400 font-normal text-xs"> {service.priceUnit}</span>}
                      </p>
                    )}
                  </div>

                  {/* Contractor info + CTA */}
                  <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 text-xs font-bold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{contractorName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] text-gray-400">{service.requestCount} requests</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedService(service); }}
                      className="text-xs font-bold px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoggedIn && services.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-violet-800">
              👋 Select any service to get quotes from contractors
            </p>
            <p className="text-xs text-violet-500 mt-1">
              Answer a few quick questions — you'll only need to login when submitting
            </p>
          </div>
        )}
      </div>

      {/* MCQ Modal */}
      {selectedService && (
        <ServiceMCQModal
          service={selectedService}
          isLoggedIn={isLoggedIn}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
