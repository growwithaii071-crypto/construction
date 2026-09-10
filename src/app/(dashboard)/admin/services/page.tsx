import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import { Wrench, HardHat, Mail, Phone, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.ServiceWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { contractor: { name: { contains: q, mode: "insensitive" } } },
          { contractor: { email: { contains: q, mode: "insensitive" } } },
          { contractor: { phone: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const services = await prisma.service
    .findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contractor: { select: { name: true, email: true, phone: true } },
        _count: { select: { requests: true } },
        requests: {
          orderBy: { createdAt: "desc" },
          take: 2,
          include: { client: { select: { name: true } } },
        },
      },
    })
    .catch(() => []);

  const active = services.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All contractor listings · {active} active · {services.length} shown
          </p>
        </div>
        <Link href="/contractors" className="text-sm font-semibold text-orange-600 hover:underline">
          View contractors →
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/admin/services"
          initialQuery={q}
          placeholder="Search service, category, contractor…"
        />
        <CsvExportButton resource="services" query={q} />
      </div>

      {services.length === 0 ? (
        <div className="py-20 text-center">
          <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">
            {q ? "No services match your search" : "No services yet"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {q
              ? "Try a different keyword"
              : "Services appear when contractors add them from their portal"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {services.map((svc) => {
            const contractorName = svc.contractor.name.split(" — ")[0];
            const company = svc.contractor.name.includes(" — ")
              ? svc.contractor.name.split(" — ")[1]
              : null;

            return (
              <Card key={svc.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {svc.category}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-0.5">{svc.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {svc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {(svc.priceFrom || svc.priceTo) && (
                  <p className="mt-3 text-sm font-semibold text-gray-800">
                    ₹{svc.priceFrom?.toLocaleString("en-IN")}
                    {svc.priceTo && svc.priceTo !== svc.priceFrom
                      ? ` – ₹${svc.priceTo.toLocaleString("en-IN")}`
                      : ""}
                    {svc.priceUnit && (
                      <span className="text-xs font-normal text-gray-400"> {svc.priceUnit}</span>
                    )}
                  </p>
                )}

                <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                  <p className="text-[10px] font-semibold uppercase text-orange-500 mb-1">
                    Contractor
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-800">
                      {contractorName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-orange-950">
                        <HardHat className="mr-1 inline h-3.5 w-3.5" />
                        {contractorName}
                      </p>
                      {company && (
                        <p className="truncate text-xs text-orange-700/80">{company}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-orange-800/80">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3" /> {svc.contractor.email}
                    </p>
                    {svc.contractor.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {svc.contractor.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {svc._count.requests} client request{svc._count.requests === 1 ? "" : "s"}
                  </span>
                  <span>
                    {new Date(svc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {svc.requests.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                      Recent clients
                    </p>
                    {svc.requests.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate font-medium text-gray-700">
                          {r.client.name.split(" — ")[0]}
                        </span>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {r.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
