"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoiceAction } from "@/actions/finance";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const tax = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + tax;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("subtotal", subtotal.toString());
    fd.set("taxAmount", tax.toString());
    fd.set("totalAmount", total.toString());
    const result = await createInvoiceAction(fd);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number *</Label>
                  <Input
                    name="invoiceNumber"
                    required
                    placeholder="INV-2026-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input name="dueDate" type="date" className="mt-1" />
                </div>
                <div>
                  <Label>Project *</Label>
                  <Input
                    name="projectId"
                    required
                    placeholder="Project ID (paste from project page)"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Client *</Label>
                  <Input name="clientId" required placeholder="Client ID" className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amount</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Subtotal (₹) *</Label>
                  <Input
                    type="number"
                    value={subtotal || ""}
                    onChange={(e) => setSubtotal(Number(e.target.value))}
                    required
                    min="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="mt-1"
                  />
                  <input type="hidden" name="taxRate" value={taxRate} />
                </div>
                <div>
                  <Label>Total (₹)</Label>
                  <Input
                    value={total.toLocaleString("en-IN")}
                    readOnly
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div className="sm:col-span-3 bg-blue-50 rounded-lg p-3 text-sm">
                  <span className="text-blue-700">
                    Tax Amount: ₹{tax.toLocaleString("en-IN")} ({taxRate}%)
                  </span>
                  <span className="ml-4 font-bold text-blue-900">
                    Total: ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    name="notes"
                    rows={3}
                    placeholder="Additional notes..."
                    className="mt-1 resize-none"
                  />
                </div>
                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    name="terms"
                    rows={3}
                    placeholder="Payment terms..."
                    className="mt-1 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select name="status" defaultValue="DRAFT">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
