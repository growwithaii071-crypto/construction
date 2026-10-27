import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Briefcase, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Jobs — BuildPro" };

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  QUOTES_RECEIVED: "bg-blue-50 text-blue-700",
  AWAITING_PAYMENT: "bg-violet-50 text-violet-700",
  FUNDED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-green-50 text-green-700",
  PAID_OUT: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-600",
  EXPIRED: "bg-slate-100 text-slate-500",
  DISPUTED: "bg-orange-50 text-orange-700",
  RESOLVED: "bg-slate-100 text-slate-600",
};

export default async function CustomerJobsPage() {
  const session = await requireAuth([UserRole.CLIENT]);

  const jobs = await prisma.marketplaceJob.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { invitations: true, quotes: true } },
    },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Post a job and we invite up to 3 matched traders to quote
          </p>
        </div>
        <Link
          href="/customer/jobs/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Post a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-800">No jobs yet</p>
          <p className="mt-1 text-sm text-slate-500">Post your first job to get quotes from local traders.</p>
          <Link
            href="/customer/jobs/new"
            className="mt-4 inline-flex text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Post a job →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/customer/jobs/${job.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900">{job.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[job.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {job.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{job.category}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span>{job._count.invitations} invited</span>
                    <span>{job._count.quotes} quotes</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
