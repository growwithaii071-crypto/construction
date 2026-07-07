import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/generated/prisma";
import { updateInvoiceStatusAction, deleteInvoiceAction } from "@/actions/finance";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoice" };

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "bg-gray-100 text-gray-600" },
  SENT: { label: "Sent", class: "bg-blue-100 text-blue-600" },
  PARTIAL: { label: "Partial", class: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", class: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", class: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", class: "bg-gray-100 text-gray-500" },
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const invoice = await prisma.invoice
    .findUnique({
      where: { id },
      include: {
        client: true,
        project: { select: { id: true, name: true, code: true } },
      },
    })
    .catch(() => null);

  if (!invoice) notFound();
  const sc = STATUS_STYLES[invoice.status] ?? STATUS_STYLES.DRAFT;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", sc.class)}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Created {format(new Date(invoice.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== InvoiceStatus.PAID && (
            <form
              action={updateInvoiceStatusAction.bind(
                null,
                id,
                InvoiceStatus.PAID,
                Number(invoice.totalAmount)
              )}
            >
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" /> Mark Paid
              </Button>
            </form>
          )}
          <form action={deleteInvoiceAction.bind(null, id)}>
            <Button
              variant="outline"
              type="submit"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="w-12 h-12 bg-[#0f2137] rounded-xl flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-sm">CO</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">Construction Co.</p>
                <p className="text-sm text-gray-400">Mumbai, Maharashtra, India</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">INVOICE</p>
                <p className="text-sm text-gray-400">{invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Bill To</p>
                {invoice.client && (
                  <>
                    <p className="font-semibold">{invoice.client.name}</p>
                    {invoice.client.company && (
                      <p className="text-sm text-gray-500">{invoice.client.company}</p>
                    )}
                    {invoice.client.email && (
                      <p className="text-sm text-gray-500">{invoice.client.email}</p>
                    )}
                    {invoice.client.gst && (
                      <p className="text-sm text-gray-400">GST: {invoice.client.gst}</p>
                    )}
                  </>
                )}
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-400">Invoice #: </span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <span className="text-gray-400">Due Date: </span>
                      <span className="font-medium">
                        {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                      </span>
                    </div>
                  )}
                  {invoice.project && (
                    <div>
                      <span className="text-gray-400">Project: </span>
                      <span className="font-medium">{invoice.project.code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 grid grid-cols-4 text-xs font-semibold text-gray-500 uppercase">
                <span className="col-span-2">Description</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-4 border-t">
                <span className="col-span-2 text-sm">Construction Services</span>
                <span className="text-right text-sm">
                  ₹{Number(invoice.subtotal).toLocaleString("en-IN")}
                </span>
                <span className="text-right text-sm">
                  ₹{Number(invoice.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{Number(invoice.subtotal).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST ({Number(invoice.taxRate)}%)</span>
                  <span>₹{Number(invoice.taxAmount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₹{Number(invoice.totalAmount).toLocaleString("en-IN")}</span>
                </div>
                {Number(invoice.paidAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>₹{Number(invoice.paidAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", sc.class)}>
                  {sc.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">
                  ₹{Number(invoice.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span className="text-green-600">
                  ₹{Number(invoice.paidAmount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Balance</span>
                <span className="text-red-600">
                  ₹
                  {(Number(invoice.totalAmount) - Number(invoice.paidAmount ?? 0)).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
