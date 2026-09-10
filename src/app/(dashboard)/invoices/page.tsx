import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Receipt, Building2, Calendar } from "lucide-react";
import { InvoiceStatus } from "@/generated/prisma";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "bg-gray-100 text-gray-600" },
  SENT: { label: "Sent", class: "bg-blue-100 text-blue-600" },
  PARTIAL: { label: "Partial", class: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", class: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", class: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", class: "bg-gray-100 text-gray-500" },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.InvoiceWhereInput = {
    ...(params.status && params.status !== "ALL"
      ? { status: params.status as InvoiceStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { invoiceNo: { contains: q, mode: "insensitive" } },
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
            { project: { name: { contains: q, mode: "insensitive" } } },
            { project: { code: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [invoices] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.invoice as any)
      .findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true, code: true } },
        },
      })
      .catch(() => []),
  ]);

  const totalAmount = (invoices as { totalAmount?: number | null }[]).reduce(
    (s, i) => s + Number(i.totalAmount ?? 0),
    0
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">
            {invoices.length} invoices · ₹{(totalAmount / 100000).toFixed(1)}L total
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/invoices/new">
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/invoices"
          initialQuery={q}
          placeholder="Search invoice no, client, project…"
          preserve={{ status: params.status }}
        />
        <CsvExportButton resource="invoices" query={q} status={params.status} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", ...Object.keys(STATUS_STYLES)].map((s) => {
          const href = q
            ? `/invoices?status=${s}&q=${encodeURIComponent(q)}`
            : `/invoices?status=${s}`;
          return (
            <Link key={s} href={href}>
              <button
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                  (params.status ?? "ALL") === s
                    ? "bg-[#0f2137] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                )}
              >
                {s === "ALL" ? "All" : STATUS_STYLES[s].label}
              </button>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {q ? "No invoices match your search" : "No invoices"}
          </p>
          {!q && (
            <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
              <Link href="/invoices/new">
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(invoices as any[]).map((inv: any) => {
            const sc = STATUS_STYLES[inv.status] ?? STATUS_STYLES.DRAFT;
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#0f2137] rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {inv.invoiceNumber ?? inv.invoiceNo}
                          </p>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              sc.class
                            )}
                          >
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {inv.client && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {inv.client.name}
                            </span>
                          )}
                          {inv.project && (
                            <span className="text-xs text-gray-400">{inv.project.code}</span>
                          )}
                          {inv.dueDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {format(new Date(inv.dueDate), "dd MMM")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      </p>
                      {Number(inv.paidAmount) > 0 && (
                        <p className="text-xs text-green-600">
                          Paid: ₹{Number(inv.paidAmount).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
