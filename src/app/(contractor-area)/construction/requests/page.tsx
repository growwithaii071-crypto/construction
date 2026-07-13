import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateRequestStatusAction } from "@/actions/services/update-request";
import { ClipboardList, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import { ServiceRequestStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Service Requests — BuildPro" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export default async function ContractorRequestsPage() {
  const session = await auth();

  const requests = await prisma.serviceRequest
    .findMany({
      where: { service: { contractorId: session?.user?.id ?? "" } },
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { title: true, category: true } },
        client: { select: { name: true, email: true, phone: true } },
      },
    })
    .catch(() => []);

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const accepted = requests.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS").length;
  const completed = requests.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pending} pending · {accepted} active · {completed} completed
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No requests yet</h2>
          <p className="text-gray-400 text-sm">Customers will send requests when they find your services.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Service */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                      {req.service.category}
                    </span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_STYLES[req.status])}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{req.service.title}</h3>

                  {/* Customer info */}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm text-gray-600 font-medium">{req.client.name}</p>
                    <p className="text-xs text-gray-400">{req.client.email}</p>
                    {req.client.phone && <p className="text-xs text-gray-400">{req.client.phone}</p>}
                  </div>

                  {req.message && (
                    <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Customer message:</p>
                      <p className="text-sm text-gray-700">{req.message}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                    {req.location && <span>📍 {req.location}</span>}
                    {req.budget && <span>💰 Budget: ₹{req.budget.toLocaleString("en-IN")}</span>}
                    <span>🕐 {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "PENDING" && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <form action={updateRequestStatusAction.bind(null, req.id, ServiceRequestStatus.ACCEPTED)}>
                      <button type="submit" className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors w-full justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                    </form>
                    <form action={updateRequestStatusAction.bind(null, req.id, ServiceRequestStatus.REJECTED)}>
                      <button type="submit" className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors w-full justify-center">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </form>
                  </div>
                )}
                {req.status === "ACCEPTED" && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <form action={updateRequestStatusAction.bind(null, req.id, ServiceRequestStatus.IN_PROGRESS)}>
                      <button type="submit" className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors w-full justify-center">
                        <PlayCircle className="w-3.5 h-3.5" /> Start Work
                      </button>
                    </form>
                  </div>
                )}
                {req.status === "IN_PROGRESS" && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <form action={updateRequestStatusAction.bind(null, req.id, ServiceRequestStatus.COMPLETED)}>
                      <button type="submit" className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors w-full justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
