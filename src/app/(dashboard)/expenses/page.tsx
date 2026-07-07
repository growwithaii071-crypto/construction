import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  await requireAuth();

  const expenses = await prisma.expense
    .findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        project: { select: { name: true, code: true } },
        submittedBy: { select: { name: true } },
      },
    })
    .catch(() => []);

  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">Total: ₹{(total / 100000).toFixed(2)}L</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/expenses/new">
            <Plus className="w-4 h-4 mr-2" /> Log Expense
          </Link>
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No expenses logged</p>
          <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/expenses/new">
              <Plus className="w-4 h-4 mr-2" /> Log Expense
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <Card key={exp.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
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
