import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Wrench, ToggleLeft, ToggleRight } from "lucide-react";
import { toggleServiceAction } from "@/actions/services/create-service";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Services — BuildPro" };

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

export default async function ContractorServicesPage() {
  const session = await auth();
  const services = await prisma.service
    .findMany({
      where: { contractorId: session?.user?.id ?? "" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { requests: true } } },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-500 text-sm mt-1">{services.length} service{services.length !== 1 ? "s" : ""} listed</p>
        </div>
        <Link
          href="/construction/services/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Service
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No services yet</h2>
          <p className="text-gray-400 text-sm mb-6">Add your first service so customers can find and request it.</p>
          <Link href="/construction/services/new" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add First Service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[service.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {service.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2 leading-snug">{service.title}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{service.description}</p>
              {(service.priceFrom || service.priceTo) && (
                <p className="text-sm font-semibold text-gray-800">
                  ₹{service.priceFrom?.toLocaleString("en-IN")}
                  {service.priceTo && service.priceTo !== service.priceFrom ? ` – ₹${service.priceTo?.toLocaleString("en-IN")}` : ""}
                  {service.priceUnit && <span className="text-gray-400 font-normal"> {service.priceUnit}</span>}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                <span className="text-xs text-gray-400">{service._count.requests} request{service._count.requests !== 1 ? "s" : ""}</span>
                <form action={toggleServiceAction.bind(null, service.id, !service.isActive)}>
                  <button type="submit" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    {service.isActive
                      ? <><ToggleRight className="w-4 h-4 text-green-500" /> Active</>
                      : <><ToggleLeft className="w-4 h-4 text-gray-300" /> Inactive</>}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
