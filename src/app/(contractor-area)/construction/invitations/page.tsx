import { requireAuth } from "@/lib/auth-utils";
import { UserRole, InvitationStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Inbox, MapPin, Clock } from "lucide-react";
import { maintainLiveInvitations } from "@/lib/matching";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Job Invitations — BuildPro" };

export default async function ContractorInvitationsPage() {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const traderId = session.user.id!;

  // Expire/refill for jobs this trader is on
  const linkedJobs = await prisma.jobInvitation.findMany({
    where: { traderId },
    select: { jobId: true },
  });
  const uniqueJobIds = [...new Set(linkedJobs.map((j) => j.jobId))];
  await Promise.all(uniqueJobIds.map((jobId) => maintainLiveInvitations(jobId)));

  const invitations = await prisma.jobInvitation.findMany({
    where: { traderId },
    orderBy: { sentAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          category: true,
          location: true,
          budgetMin: true,
          budgetMax: true,
          status: true,
          protectionStatus: true,
        },
      },
    },
  });

  const open = invitations.filter((i) =>
    [InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
      i.status as typeof InvitationStatus.SENT
    )
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Job invitations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Matched jobs awaiting your quote. Free to quote — success fee only if accepted.
        </p>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-800">No invitations yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Complete verification under Payouts to become eligible for matching.
          </p>
          <Link
            href="/construction/payouts"
            className="mt-4 inline-flex text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Go to payouts →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {open.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active ({open.length})
            </p>
          )}
          {invitations.map((inv) => {
            const isLive = [InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
              inv.status as typeof InvitationStatus.SENT
            );
            return (
              <Link
                key={inv.id}
                href={`/construction/invitations/${inv.id}`}
                className={`block rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  isLive ? "border-orange-200 hover:border-orange-300" : "border-slate-200 opacity-80"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-slate-900">{inv.job.title}</h2>
                    <p className="mt-0.5 text-sm text-slate-500">{inv.job.category}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      {inv.job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {inv.job.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires{" "}
                        {inv.expiresAt.toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {inv.job.protectionStatus === "PROTECTED" && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                          Protected job
                        </span>
                      )}
                      {inv.job.protectionStatus === "UNPROTECTED" && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                          Unprotected
                        </span>
                      )}
                      {inv.job.status === "FUNDED" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          Funded
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {inv.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
