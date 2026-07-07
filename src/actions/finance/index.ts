"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { InvoiceStatus } from "@/generated/prisma";

const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number required").optional(),
  projectId: z.string().min(1, "Project required"),
  clientId: z.string().optional(),
  dueDate: z.string().optional(),
  taxRate: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  subtotal: z.string().min(1, "Subtotal required"),
  taxAmount: z.string().optional(),
  totalAmount: z.string().min(1, "Total required"),
  status: z.nativeEnum(InvoiceStatus).optional(),
  paidAmount: z.string().optional(),
  paidDate: z.string().optional(),
});

export async function createInvoiceAction(formData: FormData) {
  const session = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = InvoiceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    const invNo = d.invoiceNumber ?? `INV-${Date.now()}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: invNo,
        invoiceNumber: invNo,
        projectId: d.projectId,
        clientId: d.clientId || undefined,
        createdById: session.user.id,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
        taxRate: d.taxRate ? parseFloat(d.taxRate) : 18,
        notes: d.notes,
        terms: d.terms,
        subtotal: parseFloat(d.subtotal),
        taxAmount: d.taxAmount ? parseFloat(d.taxAmount) : 0,
        totalAmount: parseFloat(d.totalAmount),
        status: d.status ?? InvoiceStatus.DRAFT,
        paidAmount: d.paidAmount ? parseFloat(d.paidAmount) : 0,
        paidDate: d.paidDate ? new Date(d.paidDate) : undefined,
      },
    });
    revalidatePath("/invoices");
    redirect(`/invoices/${invoice.id}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create invoice";
    return { error: msg };
  }
}

export async function updateInvoiceStatusAction(
  id: string,
  status: InvoiceStatus,
  paidAmount?: number
) {
  await requireAuth();
  await prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAmount: paidAmount ?? undefined,
      paidDate: status === InvoiceStatus.PAID ? new Date() : undefined,
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoiceAction(id: string) {
  await requireAuth();
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  redirect("/invoices");
}

const ExpenseSchema = z.object({
  title: z.string().min(1, "Title required"),
  amount: z.string().min(1, "Amount required"),
  category: z.string().min(1, "Category required"),
  projectId: z.string().optional(),
  expenseDate: z.string().min(1, "Date required"),
  vendor: z.string().optional(),
  description: z.string().optional(),
  receipt: z.string().optional(),
});

export async function createExpenseAction(formData: FormData) {
  const session = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ExpenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  try {
    await prisma.expense.create({
      data: {
        title: d.title,
        amount: parseFloat(d.amount),
        category: d.category,
        projectId: d.projectId || undefined,
        submittedById: session.user.id,
        expenseDate: new Date(d.expenseDate),
        vendor: d.vendor || undefined,
        description: d.description,
      },
    });
    revalidatePath("/expenses");
    redirect("/expenses");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create expense";
    return { error: msg };
  }
}
