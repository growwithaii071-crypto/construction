import prisma from "@/lib/prisma";
import {
  InvoiceStatus,
  MarketplacePaymentStatus,
  ProjectStatus,
  FeeLedgerStatus,
  CreditPurchaseStatus,
} from "@/generated/prisma";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type MonthPoint = {
  month: string;
  revenue: number;
  expenses: number;
  marketplace: number;
};

/** Last 12 calendar months of invoice revenue, expenses, and marketplace payments. */
export async function getMonthlyFinanceSeries(now = new Date()): Promise<MonthPoint[]> {
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);

  const [invoices, expenses, marketplacePayments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        OR: [
          { paidAmount: { gt: 0 }, updatedAt: { gte: start } },
          { status: InvoiceStatus.PAID, updatedAt: { gte: start } },
        ],
      },
      select: { paidAmount: true, totalAmount: true, status: true, updatedAt: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: start } },
      select: { amount: true, expenseDate: true },
    }),
    prisma.marketplacePayment.findMany({
      where: {
        status: MarketplacePaymentStatus.SUCCEEDED,
        updatedAt: { gte: start },
      },
      select: { customerTotal: true, updatedAt: true, createdAt: true },
    }),
  ]);

  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: MONTHS[d.getMonth()],
      year: d.getFullYear(),
      revenue: 0,
      expenses: 0,
      marketplace: 0,
    };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));

  for (const inv of invoices) {
    const when = inv.updatedAt ?? inv.createdAt;
    const key = `${when.getFullYear()}-${when.getMonth()}`;
    const i = index.get(key);
    if (i == null) continue;
    const paid =
      inv.status === InvoiceStatus.PAID
        ? inv.paidAmount || inv.totalAmount
        : inv.paidAmount;
    buckets[i].revenue += Number(paid) || 0;
  }

  for (const ex of expenses) {
    const when = ex.expenseDate;
    const key = `${when.getFullYear()}-${when.getMonth()}`;
    const i = index.get(key);
    if (i == null) continue;
    buckets[i].expenses += Number(ex.amount) || 0;
  }

  for (const pay of marketplacePayments) {
    const when = pay.updatedAt ?? pay.createdAt;
    const key = `${when.getFullYear()}-${when.getMonth()}`;
    const i = index.get(key);
    if (i == null) continue;
    buckets[i].marketplace += Number(pay.customerTotal) || 0;
    buckets[i].revenue += Number(pay.customerTotal) || 0;
  }

  return buckets.map(({ month, revenue, expenses, marketplace }) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    marketplace: Math.round(marketplace * 100) / 100,
  }));
}

export async function getProjectStatusCounts() {
  const rows = await prisma.project.groupBy({
    by: ["status"],
    _count: true,
  });
  const map = Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<
    string,
    number
  >;
  return {
    total: rows.reduce((s, r) => s + r._count, 0),
    active: map[ProjectStatus.IN_PROGRESS] ?? 0,
    completed: map[ProjectStatus.COMPLETED] ?? 0,
    planning: map[ProjectStatus.PLANNING] ?? 0,
    onHold: map[ProjectStatus.ON_HOLD] ?? 0,
    cancelled: map[ProjectStatus.CANCELLED] ?? 0,
  };
}

export async function getMarketplaceAdminStats() {
  const [
    jobsOpen,
    jobsAwarded,
    jobsFunded,
    paymentsSucceeded,
    paymentSum,
    commissionCollected,
    creditSales,
    tradersConnected,
  ] = await Promise.all([
    prisma.marketplaceJob.count({
      where: { status: { in: ["OPEN", "QUOTES_RECEIVED"] } },
    }),
    prisma.marketplaceJob.count({ where: { status: "AWARDED" } }),
    prisma.marketplaceJob.count({
      where: { status: { in: ["FUNDED", "IN_PROGRESS", "COMPLETED"] } },
    }),
    prisma.marketplacePayment.count({
      where: { status: MarketplacePaymentStatus.SUCCEEDED },
    }),
    prisma.marketplacePayment.aggregate({
      where: { status: MarketplacePaymentStatus.SUCCEEDED },
      _sum: { customerTotal: true },
    }),
    prisma.feeLedger.aggregate({
      where: { status: FeeLedgerStatus.COLLECTED },
      _sum: { amount: true },
    }),
    prisma.creditPurchase.aggregate({
      where: { status: CreditPurchaseStatus.SUCCEEDED },
      _sum: { amount: true, credits: true },
    }),
    prisma.user.count({
      where: {
        role: "CONTRACTOR",
        stripeAccountId: { not: null },
        stripeOnboardingDone: true,
      },
    }),
  ]);

  return {
    jobsOpen,
    jobsAwarded,
    jobsFunded,
    paymentsSucceeded,
    paymentVolume: paymentSum._sum.customerTotal ?? 0,
    commissionCollected: commissionCollected._sum.amount ?? 0,
    creditSales: creditSales._sum.amount ?? 0,
    creditsSold: creditSales._sum.credits ?? 0,
    tradersConnected,
  };
}
