import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ServiceRequestForm } from "@/components/customer/service-request-form";
import { Wrench, Search, X, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Services — BuildPro" };

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

export default async function CustomerServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const searchQuery = params.search?.trim() ?? "";
  const categoryFilter = params.category?.trim() ?? "";

  const [allServices, myRequests] = await Promise.all([
    prisma.service
      .findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          contractor: { select: { name: true } },
          _count: { select: { requests: true } },
        },
      })
      .catch(() => []),
    prisma.serviceRequest
      .findMany({
        where: { clientId: session?.user?.id ?? "" },
        select: { id: true, serviceId: true, status: true },
      })
      .catch(() => []),
  ]);

  // Filter by search query and/or category
  const services = allServices.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contractor.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || s.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const myRequestMap = new Map(
    myRequests.map((r) => [r.serviceId, { id: r.id, status: r.status }])
  );

  // Get unique categories for filter pills
  const categories = [...new Set(allServices.map((s) => s.category))].sort();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Services</h1>
        <p className="text-gray-500 text-sm mt-1">
          {allServices.length} services available — find the right contractor for your project
        </p>
      </div>

      {/* Search bar */}
      <form method="GET" className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            defaultValue={searchQuery}
            type="text"
            placeholder="Search by service, category or contractor..."
            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {categoryFilter && (
            <input type="hidden" name="category" value={categoryFilter} />
          )}
        </div>
        <button
          type="submit"
          className="h-11 px-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Search
        </button>
        {(searchQuery || categoryFilter) && (
          <Link
            href="/customer/services"
            className="h-11 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" /> Clear
          </Link>
        )}
      </form>

      {/* Active search indicator */}
      {searchQuery && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{services.length}</span> results for
          </span>
          <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-sm font-semibold px-3 py-1 rounded-full">
            <Search className="w-3.5 h-3.5" />
            {searchQuery}
            <Link href={categoryFilter ? `/customer/services?category=${encodeURIComponent(categoryFilter)}` : "/customer/services"}>
              <X className="w-3.5 h-3.5 hover:text-violet-900" />
            </Link>
          </span>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={searchQuery ? `/customer/services?search=${encodeURIComponent(searchQuery)}` : "/customer/services"}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              !categoryFilter
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => {
            const isActive = cat === categoryFilter;
            const href = isActive
              ? searchQuery ? `/customer/services?search=${encodeURIComponent(searchQuery)}` : "/customer/services"
              : searchQuery
              ? `/customer/services?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(cat)}`
              : `/customer/services?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      )}

      {/* Results */}
      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">
            {searchQuery ? `No results for "${searchQuery}"` : "No services yet"}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery
              ? "Try different keywords or browse all services"
              : "Contractors haven't listed any services yet. Check back soon!"}
          </p>
          {searchQuery && (
            <Link href="/customer/services"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
              ← Browse all services
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const myRequest = myRequestMap.get(service.id);
            return (
              <div key={service.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[service.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {service.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2 leading-snug">{service.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">by {service.contractor.name.split(" — ")[0]}</p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">{service.description}</p>

                {(service.priceFrom || service.priceTo) && (
                  <p className="text-sm font-semibold text-gray-800">
                    ₹{service.priceFrom?.toLocaleString("en-IN")}
                    {service.priceTo && service.priceTo !== service.priceFrom
                      ? ` – ₹${service.priceTo?.toLocaleString("en-IN")}` : ""}
                    {service.priceUnit && (
                      <span className="text-gray-400 font-normal text-xs"> {service.priceUnit}</span>
                    )}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-100">
                  {myRequest ? (
                    <div className="space-y-2">
                      <div className="text-center py-1">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          myRequest.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          myRequest.status === "ACCEPTED" || myRequest.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                          myRequest.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-600"
                        }`}>
                          {myRequest.status === "PENDING" ? "✓ Request Sent" :
                           myRequest.status === "ACCEPTED" ? "✓ Accepted" :
                           myRequest.status === "IN_PROGRESS" ? "🔨 In Progress" :
                           myRequest.status === "COMPLETED" ? "✓ Completed" : "✗ Rejected"}
                        </span>
                      </div>
                      {(myRequest.status === "ACCEPTED" ||
                        myRequest.status === "IN_PROGRESS" ||
                        myRequest.status === "COMPLETED") && (
                        <Link
                          href={`/customer/messages/${myRequest.id}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Message Contractor
                        </Link>
                      )}
                      {myRequest.status === "PENDING" && (
                        <p className="text-center text-[11px] text-gray-400">
                          Messaging unlocks after contractor accepts
                        </p>
                      )}
                    </div>
                  ) : (
                    <ServiceRequestForm serviceId={service.id} serviceTitle={service.title} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
