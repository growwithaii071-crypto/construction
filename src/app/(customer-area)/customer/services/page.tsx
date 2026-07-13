import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ServiceRequestForm } from "@/components/customer/service-request-form";
import { Search, Wrench } from "lucide-react";
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
};

export default async function CustomerServicesPage() {
  const session = await auth();

  const [services, myRequests] = await Promise.all([
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
        select: { serviceId: true, status: true },
      })
      .catch(() => []),
  ]);

  const myRequestMap = new Map(myRequests.map((r) => [r.serviceId, r.status]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Services</h1>
        <p className="text-gray-500 text-sm mt-1">
          Find the right contractor for your project — {services.length} services available
        </p>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No services yet</h2>
          <p className="text-gray-400 text-sm">Contractors haven&apos;t listed any services yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const myStatus = myRequestMap.get(service.id);
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
                    {service.priceTo && service.priceTo !== service.priceFrom ? ` – ₹${service.priceTo?.toLocaleString("en-IN")}` : ""}
                    {service.priceUnit && <span className="text-gray-400 font-normal text-xs"> {service.priceUnit}</span>}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-100">
                  {myStatus ? (
                    <div className="text-center py-1">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        myStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                        myStatus === "ACCEPTED" || myStatus === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        myStatus === "COMPLETED" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {myStatus === "PENDING" ? "✓ Request Sent" :
                         myStatus === "ACCEPTED" ? "✓ Accepted" :
                         myStatus === "IN_PROGRESS" ? "🔨 In Progress" :
                         myStatus === "COMPLETED" ? "✓ Completed" : "✗ Rejected"}
                      </span>
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
