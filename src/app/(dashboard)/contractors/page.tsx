import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { format } from "date-fns";
import { HardHat, Phone, Mail, Wrench, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Contractors" };

const PAGE_SIZE = 10;

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.UserWhereInput = {
    role: UserRole.CONTRACTOR,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalAll, activeCount, total, contractors] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.CONTRACTOR } }),
    prisma.user.count({ where: { role: UserRole.CONTRACTOR, isActive: true } }),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        contractorServices: {
          select: { id: true, isActive: true, _count: { select: { requests: true } } },
        },
        _count: { select: { contractorServices: true } },
      },
    }),
  ]).catch(() => [0, 0, 0, []] as const);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Portal contractors · view services, edit profile & password
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total
            </p>
            <p className="text-lg font-bold text-slate-900">{totalAll}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Active
            </p>
            <p className="text-lg font-bold text-emerald-700">{activeCount}</p>
          </div>
          <Link
            href="/admin/services"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            All services →
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/contractors"
          initialQuery={q}
          placeholder="Search by name, company, email or phone…"
        />
        <CsvExportButton resource="contractors" query={q} />
      </div>

      {contractors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
          <HardHat className="mx-auto h-12 w-12 text-slate-200" />
          <p className="mt-4 font-medium text-slate-600">
            {q ? "No contractors match your search" : "No contractors yet"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {q
              ? "Try a different name, email or phone"
              : "They appear here after contractor registration"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {q && (
            <p className="border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{total}</span> result
              {total === 1 ? "" : "s"} for “{q}”
            </p>
          )}
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_110px_100px_180px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:grid">
            <span>Contractor</span>
            <span>Contact</span>
            <span>Services</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {contractors.map((c) => {
              const person = c.name.split(" — ")[0];
              const company = c.name.includes(" — ") ? c.name.split(" — ")[1] : null;
              const activeServices = c.contractorServices.filter((s) => s.isActive).length;
              const requests = c.contractorServices.reduce(
                (sum, s) => sum + s._count.requests,
                0
              );

              return (
                <li
                  key={c.id}
                  className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/80 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_110px_100px_180px] lg:items-center lg:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                      {person.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{person}</p>
                      {company && (
                        <p className="truncate text-xs font-medium text-orange-600">{company}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Joined {format(new Date(c.createdAt), "dd MMM yyyy")} · {requests}{" "}
                        requests
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1 text-sm text-slate-600">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {c.email}
                    </p>
                    {c.phone ? (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {c.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">No phone</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Wrench className="h-3.5 w-3.5 text-slate-400 lg:hidden" />
                    <span className="font-semibold">{c._count.contractorServices}</span>
                    <span className="text-xs text-slate-400">({activeServices} on)</span>
                  </div>

                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        c.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/contractors/${c.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <Link
                      href={`/contractors/${c.id}/edit`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            page={safePage}
            totalPages={totalPages}
            basePath="/contractors"
            query={q}
          />
        </div>
      )}
    </div>
  );
}
