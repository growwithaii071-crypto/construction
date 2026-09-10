import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client Details" };

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default async function ClientViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const client = await prisma.user.findFirst({
    where: { id, role: UserRole.CLIENT },
    include: {
      serviceRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          service: {
            select: {
              title: true,
              category: true,
              contractor: { select: { name: true, email: true } },
            },
          },
        },
      },
      _count: { select: { serviceRequests: true } },
    },
  });

  if (!client) notFound();

  const completed = client.serviceRequests.filter((r) => r.status === "COMPLETED").length;
  const pending = client.serviceRequests.filter((r) => r.status === "PENDING").length;
  const inProgress = client.serviceRequests.filter(
    (r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/clients"
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Client · Joined {format(new Date(client.createdAt), "dd MMM yyyy")}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/clients/${id}/edit`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Pencil className="h-4 w-4" />
          Edit profile
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total services" value={String(client._count.serviceRequests)} />
        <Stat label="Completed" value={String(completed)} tone="emerald" />
        <Stat label="In progress" value={String(inProgress)} tone="blue" />
        <Stat label="Pending" value={String(pending)} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2 break-all">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              {client.email}
            </p>
            {client.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {client.phone}
              </p>
            ) : null}
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                client.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {client.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Services taken</h2>
              <p className="text-xs text-slate-500">
                All service requests by this client
              </p>
            </div>
            <ClipboardList className="h-4 w-4 text-slate-400" />
          </div>

          {client.serviceRequests.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Clock className="mx-auto h-8 w-8 text-slate-200" />
              <p className="mt-3 text-sm font-medium text-slate-600">No services yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {client.serviceRequests.map((req) => (
                <li key={req.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{req.service.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {req.service.category}
                        {" · "}
                        Contractor: {req.service.contractor.name.split(" — ")[0]}
                      </p>
                      {req.location && (
                        <p className="mt-1 text-xs text-slate-400">Location: {req.location}</p>
                      )}
                      {req.budget != null && (
                        <p className="text-xs text-slate-400">
                          Budget: ₹{req.budget.toLocaleString("en-IN")}
                        </p>
                      )}
                      {req.message && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{req.message}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          STATUS_STYLE[req.status] ?? "bg-slate-100 text-slate-600"
                        )}
                      >
                        {req.status.replaceAll("_", " ")}
                      </span>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        {format(new Date(req.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "blue" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "emerald" && "text-emerald-600",
          tone === "blue" && "text-blue-600",
          tone === "amber" && "text-amber-600",
          tone === "slate" && "text-slate-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}
