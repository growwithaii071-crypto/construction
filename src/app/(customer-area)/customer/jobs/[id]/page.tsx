import { requireAuth } from "@/lib/auth-utils";
import { UserRole, InvitationStatus, QuoteStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Users, FileText } from "lucide-react";
import { JobStatusTimeline } from "@/components/marketplace/job-status-timeline";
import { BilingualAlert } from "@/components/ui/bilingual-alert";
import { JobReviewForm } from "@/components/marketplace/job-review-form";
import { WhatsAppTraderLink } from "@/components/marketplace/whatsapp-trader-link";
import { FlowBadge } from "@/components/marketplace/flow-badge";
import { maintainLiveInvitations } from "@/lib/matching";
import { CancelJobButton } from "@/components/marketplace/cancel-job-button";
import { AcceptQuotePanel } from "@/components/marketplace/accept-quote-panel";
import { CustomerJobActions } from "@/components/marketplace/job-lifecycle-actions";
import {
  RaiseDisputeForm,
  ReportProblemForm,
} from "@/components/marketplace/dispute-forms";
import { getPricingConfig, buildPricePreview } from "@/lib/pricing";
import { processAutoConfirms } from "@/lib/marketplace-payouts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Job detail — BuildPro" };

export default async function CustomerJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ accept?: string; paid?: string }>;
}) {
  const session = await requireAuth([UserRole.CLIENT]);
  const { id } = await params;
  const sp = await searchParams;

  const job = await prisma.marketplaceJob.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { trader: { select: { name: true, phone: true } } },
      },
      review: true,
    },
  });

  if (!job || job.clientId !== session.user.id) notFound();

  void processAutoConfirms(5);
  await maintainLiveInvitations(job.id);

  const invitations = await prisma.jobInvitation.findMany({
    where: { jobId: job.id },
    orderBy: { rank: "asc" },
    include: { trader: { select: { name: true } } },
  });

  const live = invitations.filter((i) =>
    [InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
      i.status as typeof InvitationStatus.SENT
    )
  ).length;

  const config = await getPricingConfig();
  const acceptQuoteId = sp.accept;
  const acceptQuote = acceptQuoteId
    ? job.quotes.find((q) => q.id === acceptQuoteId && q.status === QuoteStatus.SUBMITTED)
    : null;

  const canAccept =
    job.status === "OPEN" || job.status === "QUOTES_RECEIVED";

  const disputeEligible = ["FUNDED", "IN_PROGRESS", "COMPLETED"].includes(
    job.status
  );

  const openDispute =
    job.status === "DISPUTED"
      ? await prisma.dispute.findFirst({
          where: {
            jobId: job.id,
            status: { in: ["OPEN", "UNDER_REVIEW"] },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href="/customer/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          My Jobs
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <FlowBadge flow="marketplace" className="mb-2" />
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {job.category}
              {job.location ? (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {job.status.replaceAll("_", " ")}
            </span>
            {job.protectionStatus !== "UNDECIDED" && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                {job.protectionStatus}
              </span>
            )}
            {[
              "FUNDED",
              "IN_PROGRESS",
              "COMPLETED",
              "PAID_OUT",
              "RESOLVED",
            ].includes(job.status) && (
              <Link
                href={`/customer/jobs/${job.id}/receipt`}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                <FileText className="h-3 w-3" />
                Receipt PDF
              </Link>
            )}
          </div>
        </div>
      </div>

      {sp.paid === "1" && job.status === "AWAITING_PAYMENT" && (
        <BilingualAlert
          tone="info"
          en="Webhook pending… Payment sent. Job becomes FUNDED when Stripe confirms."
          hi="Webhook लंबित… भुगतान भेज दिया। Stripe कन्फर्म होते ही जॉब FUNDED होगा।"
        />
      )}

      <JobStatusTimeline status={job.status} />

      {["COMPLETED", "PAID_OUT", "RESOLVED"].includes(job.status) &&
        (job.review ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Your review: <strong>{job.review.rating}★</strong>
            {job.review.comment ? ` — ${job.review.comment}` : ""}
          </div>
        ) : (
          <JobReviewForm jobId={job.id} />
        ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {job.description}
        </p>
        {job.photos?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.photos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}
        {(job.budgetMin != null || job.budgetMax != null) && (
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Budget:{" "}
            {job.budgetMin != null ? `£${job.budgetMin.toLocaleString("en-GB")}` : "—"}
            {" – "}
            {job.budgetMax != null ? `£${job.budgetMax.toLocaleString("en-GB")}` : "—"}
            {job.jobSize ? ` · ${job.jobSize}` : ""}
          </p>
        )}
      </div>

      {acceptQuote && canAccept && (
        <AcceptQuotePanel
          quoteId={acceptQuote.id}
          traderName={acceptQuote.trader.name.split(" — ")[0] ?? "Trader"}
          preview={buildPricePreview(
            acceptQuote.amount,
            config,
            job.category,
            job.jobSize
          )}
          expired={acceptQuote.validUntil < new Date()}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Users className="h-4 w-4 text-orange-500" />
            Trader invitations
          </h2>
          <span className="text-xs font-semibold text-slate-500">{live} live · target 3</span>
        </div>

        {invitations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-semibold text-slate-800">No invitations yet</p>
            <p className="mt-1 text-sm text-slate-500">
              No matched traders yet for <span className="font-medium">{job.category}</span>.
              Verified traders in this category get invited automatically.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              अभी कोई निमंत्रण नहीं · इस कैटेगरी में verified traders जुड़ने पर आमंत्रित होंगे।
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/customer/jobs/new"
                className="inline-flex h-9 items-center rounded-lg bg-orange-500 px-3 text-xs font-bold text-white hover:bg-orange-600"
              >
                Post another job
              </Link>
              <Link
                href="/services"
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0B2A4A] hover:bg-slate-50"
              >
                Browse traders
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {inv.trader.name.split(" — ")[0]}
                  </p>
                  <p className="text-xs text-slate-400">
                    Rank #{inv.rank} · expires{" "}
                    {inv.expiresAt.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                  {inv.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-slate-900">Quotes</h2>
        {job.quotes.length === 0 ? (
          <p className="text-sm text-slate-500">No quotes yet. Traders have been notified.</p>
        ) : (
          <ul className="space-y-3">
            {job.quotes.map((q) => (
              <li
                key={q.id}
                className="rounded-xl border border-slate-100 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{q.trader.name.split(" — ")[0]}</p>
                    <p className="text-xs text-slate-400">
                      {q.status.replaceAll("_", " ")}
                      {q.scope ? ` · ${q.scope.slice(0, 80)}` : ""}
                    </p>
                    {q.status === "SUBMITTED" || q.status === "ACCEPTED" ? (
                      <div className="mt-2">
                        <WhatsAppTraderLink
                          phone={q.trader.phone}
                          jobTitle={job.title}
                        />
                      </div>
                    ) : null}
                    <p className="text-[11px] text-slate-400">
                      Valid until{" "}
                      {q.validUntil.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0B2A4A]">
                      £{q.amount.toLocaleString("en-GB")}
                    </p>
                    {canAccept && q.status === QuoteStatus.SUBMITTED && (
                      <Link
                        href={`/customer/jobs/${job.id}?accept=${q.id}`}
                        className="mt-1 inline-flex text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        Review &amp; accept →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {job.status === "AWAITING_PAYMENT" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-[#0B2A4A]">
            <p>Quote accepted — pay securely to fund the job.</p>
            <Link
              href={`/customer/jobs/${job.id}/pay`}
              className="inline-flex h-10 items-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600"
            >
              Pay now →
            </Link>
          </div>
        )}

        {job.status === "FUNDED" && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Payment confirmed. Job is funded — the trader can start work.
            {job.protectionStatus === "PROTECTED"
              ? " Funds are held until you confirm completion."
              : " Unprotected: funds release at job start."}
          </p>
        )}
      </div>

      <CustomerJobActions jobId={job.id} status={job.status} />

      {job.status === "DISPUTED" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-bold">Dispute open</p>
          <p className="mt-1 text-amber-800/90">
            Funds are held until an admin resolves this case.
            {openDispute?.reason ? ` Your reason: “${openDispute.reason}”` : ""}
          </p>
        </div>
      )}

      {disputeEligible && job.protectionStatus === "PROTECTED" && (
        <RaiseDisputeForm jobId={job.id} />
      )}

      {disputeEligible && job.protectionStatus === "UNPROTECTED" && (
        <ReportProblemForm jobId={job.id} />
      )}

      {(job.status === "OPEN" || job.status === "QUOTES_RECEIVED") && (
        <CancelJobButton jobId={job.id} />
      )}
    </div>
  );
}
