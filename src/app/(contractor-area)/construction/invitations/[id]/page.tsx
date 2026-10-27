import { requireAuth } from "@/lib/auth-utils";
import { UserRole, InvitationStatus, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, BadgeCheck } from "lucide-react";
import { markInvitationViewedAction } from "@/actions/marketplace/jobs";
import { DeclineInvitationButton } from "@/components/marketplace/decline-invitation-button";
import { SubmitQuoteForm } from "@/components/marketplace/submit-quote-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invitation — BuildPro" };

export default async function InvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const { id } = await params;

  const inv = await prisma.jobInvitation.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!inv || inv.traderId !== session.user.id) notFound();

  await markInvitationViewedAction(id);

  const existingQuote = await prisma.quote.findFirst({
    where: {
      jobId: inv.jobId,
      traderId: session.user.id,
      status: { in: [QuoteStatus.SUBMITTED, QuoteStatus.ACCEPTED, QuoteStatus.NOT_SELECTED] },
    },
    orderBy: { createdAt: "desc" },
  });

  const isLive = [InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
    inv.status as typeof InvitationStatus.SENT
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <Link
        href="/construction/invitations"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Invitations
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{inv.job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{inv.job.category}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {inv.status}
          </span>
        </div>

        {inv.job.location && (
          <p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {inv.job.location}
          </p>
        )}

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {inv.job.description}
        </p>

        {(inv.job.budgetMin != null || inv.job.budgetMax != null) && (
          <p className="mt-4 text-sm font-semibold text-slate-800">
            Budget:{" "}
            {inv.job.budgetMin != null ? `₹${inv.job.budgetMin.toLocaleString("en-IN")}` : "—"}
            {" – "}
            {inv.job.budgetMax != null ? `₹${inv.job.budgetMax.toLocaleString("en-IN")}` : "—"}
          </p>
        )}

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="flex items-center gap-2 font-semibold">
            <BadgeCheck className="h-4 w-4" />
            Free to quote
          </p>
          <p className="mt-1 text-blue-800/80">
            Success fee applies only if the customer accepts your quote.
          </p>
        </div>

        {existingQuote ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">
              Your quote: ₹{existingQuote.amount.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-emerald-800/80">
              Status: {existingQuote.status.replaceAll("_", " ")} · valid until{" "}
              {existingQuote.validUntil.toLocaleDateString("en-IN")}
            </p>
          </div>
        ) : (
          isLive && (
            <>
              <SubmitQuoteForm invitationId={inv.id} />
              <div className="mt-3">
                <DeclineInvitationButton invitationId={inv.id} />
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
