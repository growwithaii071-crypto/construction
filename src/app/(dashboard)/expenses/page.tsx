import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.ExpenseWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { vendor: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { project: { name: { contains: q, mode: "insensitive" } } },
          { project: { code: { contains: q, mode: "insensitive" } } },
          { submittedBy: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const expenses = await prisma.expense
    .findMany({
      where,
      orderBy: { expenseDate: "desc" },
      include: {
        project: { select: { name: true, code: true } },
        submittedBy: { select: { name: true } },
      },
    })
    .catch(() => []);

  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">Total: ₹{(total / 100000).toFixed(2)}L</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/expenses/new">
            <Plus className="mr-2 h-4 w-4" /> Log Expense
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/expenses"
          initialQuery={q}
          placeholder="Search title, category, vendor, project…"
        />
        <CsvExportButton resource="expenses" query={q} />
      </div>

      {expenses.length === 0 ? (
        <div className="py-20 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">
            {q ? "No expenses match your search" : "No expenses logged"}
          </p>
          {!q && (
            <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" /> Log Expense
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <Card key={exp.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exp.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{exp.category}</span>
                      {exp.project && (
                        <span className="text-xs text-gray-400">· {exp.project.name}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        · {format(new Date(exp.expenseDate), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">{exp.submittedBy?.name}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
