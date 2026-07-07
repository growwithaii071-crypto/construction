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
import { createExpenseAction } from "@/actions/finance";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "MATERIALS",
  "LABOR",
  "EQUIPMENT",
  "TRANSPORT",
  "UTILITIES",
  "PERMITS",
  "CONSULTANCY",
  "MISCELLANEOUS",
];

export default function NewExpensePage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createExpenseAction(fd);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Log Expense</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Title *</Label>
              <Input name="title" required placeholder="e.g. Cement purchase" className="mt-1" />
            </div>
            <div>
              <Label>Amount (₹) *</Label>
              <Input
                name="amount"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Input name="expenseDate" type="date" required className="mt-1" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select name="category" defaultValue="MATERIALS">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Input name="vendor" placeholder="Vendor name" className="mt-1" />
            </div>
            <div>
              <Label>Project ID (optional)</Label>
              <Input name="projectId" placeholder="Paste project ID" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea name="description" rows={3} className="mt-1 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={pending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
