import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, Download, Printer, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoices — BuildPro Contractor" };

async function getInvoiceData(userId: string) {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { service: { contractorId: userId }, status: { in: ["COMPLETED", "IN_PROGRESS", "ACCEPTED"] } },
      include: {
        service: { select: { title: true, category: true, priceFrom: true } },
        client: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return requests;
  } catch {
    return [];
  }
}

function getInvoiceNumber(id: string, index: number): string {
  return `INV-${String(index + 1001).padStart(4, "0")}`;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  COMPLETED: { label: "Paid", icon: CheckCircle2, cls: "bg-green-50 text-green-700 border-green-200" },
  IN_PROGRESS: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ACCEPTED: { label: "Draft", icon: AlertCircle, cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default async function InvoicesPage() {
  const session = await auth();
  const requests = await getInvoiceData(session?.user?.id ?? "");

  const totalPaid = requests.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + (r.budget ?? 0), 0);
  const totalPending = requests.filter((r) => r.status !== "COMPLETED").reduce((s, r) => s + (r.budget ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track invoices for your jobs</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Invoices</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{requests.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">All generated</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Amount Collected</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">₹{totalPaid.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-400 mt-0.5">From paid invoices</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Outstanding</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">₹{totalPending.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pending collection</p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Invoices</h2>
        </div>

        {requests.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <FileText className="w-12 h-12 text-gray-200 mb-4" />
            <p className="font-semibold text-gray-600">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1">Invoices are created automatically when jobs are accepted</p>
            <Link href="/construction/requests"
              className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              View Requests →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-3 px-6">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-3 px-2">Service</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-3 px-2">Customer</th>
                  <th className="text-right text-xs font-semibold text-gray-400 pb-3 pt-3 px-4">Amount</th>
                  <th className="text-center text-xs font-semibold text-gray-400 pb-3 pt-3 px-4">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-400 pb-3 pt-3 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r, i) => {
                  const inv = STATUS_MAP[r.status] ?? STATUS_MAP.ACCEPTED;
                  const InvIcon = inv.icon;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 group">
                      <td className="py-4 px-6">
                        <p className="font-mono text-sm font-semibold text-gray-900">{getInvoiceNumber(r.id, i)}</p>
                      </td>
                      <td className="py-4 px-2">
                        <p className="font-semibold text-gray-900 text-sm">{r.service.title}</p>
                        <p className="text-xs text-gray-400">{r.service.category}</p>
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-sm text-gray-700">{r.client.name}</p>
                        <p className="text-xs text-gray-400">{r.client.email}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {r.budget ? (
                          <p className="font-bold text-gray-900">₹{r.budget.toLocaleString("en-IN")}</p>
                        ) : (
                          <p className="text-gray-300 text-xs">Not set</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border", inv.cls)}>
                          <InvIcon className="w-3 h-3" />
                          {inv.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString("en-IN")}</p>
                        <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Print" className="text-gray-400 hover:text-gray-700 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button title="Download" className="text-gray-400 hover:text-gray-700 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
