import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import {
  FolderKanban,
  Building2,
  HardHat,
  Calendar,
  IndianRupee,
  MapPin,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Projects / Jobs" };

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-amber-100 text-amber-700 border-amber-200" },
  ACCEPTED: { label: "Accepted", class: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", class: "bg-violet-100 text-violet-700 border-violet-200" },
  COMPLETED: { label: "Completed", class: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Rejected", class: "bg-red-100 text-red-700 border-red-200" },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const statusFilter = params.status && params.status !== "ALL" ? params.status : null;

  const where: Prisma.ServiceRequestWhereInput = {
    ...(statusFilter ? { status: statusFilter as never } : {}),
    ...(q
      ? {
          OR: [
            { location: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
            { client: { email: { contains: q, mode: "insensitive" } } },
            { service: { title: { contains: q, mode: "insensitive" } } },
            { service: { category: { contains: q, mode: "insensitive" } } },
            { service: { contractor: { name: { contains: q, mode: "insensitive" } } } },
            { service: { contractor: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const jobs = await prisma.serviceRequest
    .findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true, phone: true } },
        service: {
          select: {
            title: true,
            category: true,
            priceFrom: true,
            priceTo: true,
            priceUnit: true,
            contractor: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    })
    .catch(() => []);

  const countsRaw = await prisma.serviceRequest
    .groupBy({ by: ["status"], _count: true })
    .catch(() => [] as { status: string; _count: number }[]);
  const counts = Object.fromEntries(countsRaw.map((s) => [s.status, s._count]));
  const totalAll = countsRaw.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects / Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Client ↔ Contractor service requests · {jobs.length} shown
          </p>
        </div>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Wrench className="w-4 h-4" />
          All Services
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/projects"
          initialQuery={q}
          placeholder="Search jobs, clients, contractors…"
          preserve={{ status: params.status }}
        />
        <CsvExportButton resource="projects" query={q} status={params.status} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "ALL", label: "All", count: totalAll },
          ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
            value,
            label: cfg.label,
            count: counts[value] ?? 0,
          })),
        ].map((tab) => {
          const href = q
            ? `/projects?status=${tab.value}&q=${encodeURIComponent(q)}`
            : `/projects?status=${tab.value}`;
          return (
            <Link key={tab.value} href={href}>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  (params.status ?? "ALL") === tab.value
                    ? "bg-[#0f2137] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    (params.status ?? "ALL") === tab.value ? "bg-white/20" : "bg-gray-100"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            </Link>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {q ? "No jobs match your search" : "No service jobs yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {q
              ? "Try a different keyword or clear filters"
              : "When a client requests a contractor service, it will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map((job) => {
            const sc = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
            const contractorName = job.service.contractor.name.split(" — ")[0];
            const clientName = job.client.name.split(" — ")[0];

            return (
              <Card key={job.id} className="p-5 h-full">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                      {job.service.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{job.service.category}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                      sc.class
                    )}
                  >
                    {sc.label}
                  </span>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-violet-500 mb-0.5">Client</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{clientName}</span>
                    </div>
                    <p className="text-xs text-violet-600/80 truncate mt-0.5">{job.client.email}</p>
                  </div>

                  <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-orange-500 mb-0.5">
                      Contractor
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                      <HardHat className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{contractorName}</span>
                    </div>
                    <p className="text-xs text-orange-600/80 truncate mt-0.5">
                      {job.service.contractor.email}
                    </p>
                  </div>

                  {job.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </div>
                  )}
                  {(job.budget || job.service.priceFrom) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {job.budget
                        ? `Budget: ₹${job.budget.toLocaleString("en-IN")}`
                        : `From ₹${job.service.priceFrom?.toLocaleString("en-IN")}`}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {job.message && (
                  <p className="text-xs text-gray-500 line-clamp-2 border-t pt-3">{job.message}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
