import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, XCircle, TrendingUp, Wrench, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Requests — BuildPro" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export default async function CustomerRequestsPage() {
  const session = await auth();

  const requests = await prisma.serviceRequest
    .findMany({
      where: { clientId: session?.user?.id ?? "" },
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: {
            title: true,
            category: true,
            priceFrom: true,
            priceTo: true,
            priceUnit: true,
            contractor: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    })
    .catch(() => []);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    active: requests.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.all} total · {counts.pending} pending · {counts.active} active · {counts.completed} completed
          </p>
        </div>
        <Link
          href="/customer/services"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Wrench className="w-4 h-4" />
          Browse Services
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No requests yet</h2>
          <p className="text-gray-400 text-sm mb-6">
            Browse available services and send your first request to a contractor.
          </p>
          <Link
            href="/customer/services"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Wrench className="w-4 h-4" />
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category + status */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                      {req.service.category}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1",
                      STATUS_STYLES[req.status]
                    )}>
                      {req.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {req.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                      {req.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {req.status === "IN_PROGRESS" && <TrendingUp className="w-3 h-3" />}
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">{req.service.title}</h3>

                  {/* Contractor info */}
                  <div className="mt-2.5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs shrink-0">
                      {req.service.contractor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {req.service.contractor.name.split(" — ")[0]}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {req.service.contractor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {req.service.contractor.email}
                          </span>
                        )}
                        {req.service.contractor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {req.service.contractor.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Your message */}
                  {req.message && (
                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Your message:</p>
                      <p className="text-sm text-gray-700">{req.message}</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                    {req.location && <span>📍 {req.location}</span>}
                    {req.budget && <span>💰 Budget: ₹{req.budget.toLocaleString("en-IN")}</span>}
                    {(req.service.priceFrom || req.service.priceTo) && (
                      <span>
                        💵 ₹{req.service.priceFrom?.toLocaleString("en-IN")}
                        {req.service.priceTo && req.service.priceTo !== req.service.priceFrom
                          ? ` – ₹${req.service.priceTo?.toLocaleString("en-IN")}`
                          : ""}
                        {req.service.priceUnit ? ` ${req.service.priceUnit}` : ""}
                      </span>
                    )}
                    <span>
                      🕐 {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className={cn(
                  "shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border",
                  STATUS_STYLES[req.status]
                )}>
                  {req.status === "PENDING" && <Clock className="w-6 h-6 mb-1" />}
                  {req.status === "ACCEPTED" && <CheckCircle2 className="w-6 h-6 mb-1" />}
                  {req.status === "IN_PROGRESS" && <TrendingUp className="w-6 h-6 mb-1" />}
                  {req.status === "COMPLETED" && <CheckCircle2 className="w-6 h-6 mb-1" />}
                  {req.status === "REJECTED" && <XCircle className="w-6 h-6 mb-1" />}
                  <p className="text-[10px] font-bold text-center leading-tight px-1">
                    {STATUS_LABELS[req.status]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
