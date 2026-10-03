"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  BadgeCheck,
  Briefcase,
  Calendar,
  Phone,
  Bell,
  HardHat,
  SlidersHorizontal,
  ChevronDown,
  Wrench,
  User,
  UserRound,
} from "lucide-react";
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
  rating: number;
  reviews: number;
  years: number;
  distanceKm: string;
  city: string;
  online: boolean;
  availability: string;
  tags: string[];
  contractor: { name: string; avatar?: string | null; phone?: string | null };
};

type Props = {
  services: Service[];
  categories: string[];
  cities: string[];
  searchQuery: string;
  categoryFilter: string;
  locationFilter: string;
  jobTypeFilter: string;
  ratingFilter: string;
  sortBy: string;
  isLoggedIn: boolean;
  totalCount: number;
};

function DummyTraderIcon() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-linear-to-br from-blue-100 via-slate-100 to-blue-50 text-blue-600">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <UserRound className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <HardHat className="h-4 w-4 text-blue-500/80" />
    </div>
  );
}

function TraderAvatar({
  serviceId,
  name,
  avatar,
  online,
  broken,
  onBroken,
}: {
  serviceId: string;
  name: string;
  avatar?: string | null;
  online: boolean;
  broken: boolean;
  onBroken: (id: string) => void;
}) {
  const showImage = !!avatar && !broken;

  return (
    <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0 sm:h-32 sm:w-32">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar!}
          alt={name}
          onError={() => onBroken(serviceId)}
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <DummyTraderIcon />
      )}
      {online && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
          Online
        </span>
      )}
    </div>
  );
}

export function ServicesClient({
  services,
  categories,
  cities,
  searchQuery,
  categoryFilter,
  locationFilter,
  jobTypeFilter,
  ratingFilter,
  sortBy,
  isLoggedIn,
  totalCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resume = searchParams.get("resume") === "1";

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [locationInput, setLocationInput] = useState(locationFilter);
  const [sideCategory, setSideCategory] = useState(categoryFilter);
  const [sideJobType, setSideJobType] = useState(jobTypeFilter || "all");
  const [sideRating, setSideRating] = useState(ratingFilter);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  function buildUrl(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const next = {
      search: searchInput.trim() || searchQuery,
      category: sideCategory,
      location: locationInput.trim() || locationFilter,
      jobType: sideJobType,
      rating: sideRating,
      sort: sortBy,
      ...overrides,
    };
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
    });
    const qs = params.toString();
    return `/services${qs ? `?${qs}` : ""}`;
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(buildUrl());
    setMobileFilters(false);
  }

  function handleCloseModal() {
    setSelectedService(null);
    localStorage.removeItem("pendingServiceRequest");
  }

  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});

  const locationLabel = locationFilter || "your area";

  const FilterPanel = (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          Location
        </label>
        <select
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All locations</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Wrench className="h-3.5 w-3.5 text-blue-600" />
          Trade / Category
        </label>
        <select
          value={sideCategory}
          onChange={(e) => setSideCategory(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Trades</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Job Type</p>
        <div className="space-y-2">
          {[
            { value: "all", label: "All" },
            { value: "hourly", label: "Hourly Rate" },
            { value: "fixed", label: "Fixed Price" },
            { value: "emergency", label: "Emergency" },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="radio"
                name="jobType"
                checked={sideJobType === opt.value}
                onChange={() => setSideJobType(opt.value)}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-800">Availability</label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          defaultValue="any"
        >
          <option value="any">Any Time</option>
          <option value="today">Available today</option>
          <option value="week">This week</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-800">Experience Level</label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          defaultValue="any"
        >
          <option value="any">Any Level</option>
          <option value="junior">1–5 years</option>
          <option value="mid">5–10 years</option>
          <option value="senior">10+ years</option>
        </select>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          Rating
        </p>
        <div className="space-y-2">
          {[
            { value: "4", label: "4+ Stars" },
            { value: "3", label: "3+ Stars" },
            { value: "2", label: "2+ Stars" },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={sideRating === opt.value}
                onChange={() => setSideRating(sideRating === opt.value ? "" : opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => applyFilters()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Top marketplace bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="hidden shrink-0 items-center gap-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                Build<span className="text-blue-600">Pro</span>
              </p>
              <p className="text-[10px] font-medium text-slate-400">Find · Hire · Get It Done</p>
            </div>
          </Link>

          <form onSubmit={applyFilters} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for tradesmen (e.g. plumber, electrician, painter…)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="relative hidden w-48 shrink-0 md:block">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
              <select
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All locations</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <Link
              href="/customer/register"
              className="hidden h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:inline-flex"
            >
              Post a Job
            </Link>
            {isLoggedIn ? (
              <Link
                href="/customer/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <span className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-400 md:inline-flex">
                  <Bell className="h-5 w-5" />
                </span>
                <Link
                  href="/login"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                >
                  <User className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">
          <h2 className="mb-4 text-base font-bold text-slate-900">Filters</h2>
          {FilterPanel}
        </aside>

        {/* Results */}
        <main className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Found{" "}
              <span className="font-bold text-slate-900">{services.length}</span>{" "}
              tradesmen{locationFilter ? ` near ${locationLabel}` : ""}
              {searchQuery ? (
                <>
                  {" "}
                  for <span className="font-semibold text-blue-700">&ldquo;{searchQuery}&rdquo;</span>
                </>
              ) : null}
              <span className="text-slate-400"> · {totalCount} listed</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="best">Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <Wrench className="mx-auto mb-4 h-12 w-12 text-slate-200" />
              <h2 className="text-lg font-semibold text-slate-800">No tradesmen found</h2>
              <p className="mt-1 text-sm text-slate-500">Try different filters or clear your search.</p>
              <Link href="/services" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                ← Clear all filters
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const name = service.contractor.name.split(" — ")[0];
                const expanded = expandedId === service.id;
                const price =
                  service.priceFrom != null
                    ? `₹${service.priceFrom.toLocaleString("en-IN")}`
                    : "Quote";
                const unit =
                  service.priceUnit?.toLowerCase().includes("hr") ||
                  service.priceUnit?.toLowerCase().includes("hour")
                    ? "/hr"
                    : service.priceUnit
                      ? ` ${service.priceUnit}`
                      : "";

                return (
                  <article
                    key={service.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <TraderAvatar
                        serviceId={service.id}
                        name={name}
                        avatar={service.contractor.avatar}
                        online={service.online}
                        broken={!!brokenAvatars[service.id]}
                        onBroken={(id) =>
                          setBrokenAvatars((prev) => ({ ...prev, [id]: true }))
                        }
                      />

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-blue-700">{name}</h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <BadgeCheck className="h-4 w-4" />
                            Verified Tradesman
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {service.rating.toFixed(1)}
                            <span className="font-normal text-slate-400">({service.reviews} reviews)</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {service.distanceKm} km away · {service.city}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {service.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className={cn("mt-2.5 text-sm leading-relaxed text-slate-600", !expanded && "line-clamp-2")}>
                          <span className="font-medium text-slate-800">{service.title}. </span>
                          {service.description}
                        </p>
                        {service.description.length > 120 && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : service.id)}
                            className="mt-0.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {expanded ? "Show less" : "Read more"}
                          </button>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                            {service.years}+ years experience
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {service.availability}
                          </span>
                        </div>
                      </div>

                      {/* Price + actions */}
                      <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-36 sm:flex-col sm:items-stretch sm:justify-start sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0">
                        <div className="sm:text-right">
                          <p className="text-xl font-extrabold text-slate-900">
                            {price}
                            <span className="text-sm font-semibold text-slate-500">{unit}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">(or fixed price)</p>
                        </div>
                        <div className="flex gap-2 sm:mt-3 sm:flex-col">
                          <button
                            type="button"
                            onClick={() => setSelectedService(service)}
                            className="h-10 flex-1 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:flex-none"
                          >
                            Contact
                          </button>
                          {service.contractor.phone ? (
                            <a
                              href={`tel:${service.contractor.phone}`}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-600 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 sm:flex-none"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedService(service)}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-600 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 sm:flex-none"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filters drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilters(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,320px)] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}

      {selectedService && (
        <ServiceMCQModal
          service={selectedService}
          isLoggedIn={isLoggedIn}
          autoSubmitPending={resume}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
