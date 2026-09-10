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
  Wrench,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contractor Details" };

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default async function ContractorViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const contractor = await prisma.user.findFirst({
    where: { id, role: UserRole.CONTRACTOR },
    include: {
      contractorServices: {
        orderBy: { createdAt: "desc" },
        include: {
          requests: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { client: { select: { name: true, email: true } } },
          },
          _count: { select: { requests: true } },
        },
      },
      _count: { select: { contractorServices: true } },
    },
  });

  if (!contractor) notFound();

  const person = contractor.name.split(" — ")[0];
  const company = contractor.name.includes(" — ")
    ? contractor.name.split(" — ")[1]
    : null;
  const activeServices = contractor.contractorServices.filter((s) => s.isActive).length;
  const totalRequests = contractor.contractorServices.reduce(
    (sum, s) => sum + s._count.requests,
    0
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/contractors"
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-xl font-bold text-orange-700">
              {person.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{person}</h1>
              {company && <p className="text-sm font-medium text-orange-600">{company}</p>}
              <p className="mt-0.5 text-sm text-slate-500">
                Contractor · Joined {format(new Date(contractor.createdAt), "dd MMM yyyy")}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/contractors/${id}/edit`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Pencil className="h-4 w-4" />
          Edit profile
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Services" value={String(contractor._count.contractorServices)} />
        <Stat label="Active services" value={String(activeServices)} tone="emerald" />
        <Stat label="Total requests" value={String(totalRequests)} tone="blue" />
        <Stat
          label="Account"
          value={contractor.isActive ? "Active" : "Inactive"}
          tone={contractor.isActive ? "emerald" : "slate"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2 break-all">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              {contractor.email}
            </p>
            {contractor.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {contractor.phone}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Listed services</h2>
                <p className="text-xs text-slate-500">Services offered by this contractor</p>
              </div>
              <Wrench className="h-4 w-4 text-slate-400" />
            </div>

            {contractor.contractorServices.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-slate-500">
                No services listed yet
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contractor.contractorServices.map((svc) => (
                  <li key={svc.id} className="px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{svc.title}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              svc.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {svc.isActive ? "Active" : "Off"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {svc.category}
                          {(svc.priceFrom || svc.priceTo) && (
                            <>
                              {" · "}₹{svc.priceFrom?.toLocaleString("en-IN") ?? "—"}
                              {svc.priceTo && svc.priceTo !== svc.priceFrom
                                ? `–₹${svc.priceTo.toLocaleString("en-IN")}`
                                : ""}
                            </>
                          )}
                          {" · "}
                          {svc._count.requests} requests
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {svc.description}
                        </p>
                      </div>
                    </div>

                    {svc.requests.length > 0 && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <ClipboardList className="h-3.5 w-3.5" />
                          Recent clients
                        </p>
                        <ul className="space-y-2">
                          {svc.requests.map((req) => (
                            <li
                              key={req.id}
                              className="flex items-start justify-between gap-2 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">
                                  {req.client.name}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {req.client.email}
                                  {" · "}
                                  {format(new Date(req.createdAt), "dd MMM yyyy")}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  STATUS_STYLE[req.status] ?? "bg-slate-100"
                                )}
                              >
                                {req.status.replaceAll("_", " ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
  tone?: "slate" | "emerald" | "blue";
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
          tone === "slate" && "text-slate-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}
