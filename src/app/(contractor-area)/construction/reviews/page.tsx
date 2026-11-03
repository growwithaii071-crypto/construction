import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowBadge } from "@/components/marketplace/flow-badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews — BuildPro Contractor" };

export default async function ReviewsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const reviews = userId
    ? await prisma.jobReview.findMany({
        where: { traderId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          job: { select: { title: true, category: true } },
        },
      })
    : [];

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
  const fiveStar = reviews.filter((r) => r.rating === 5).length;
  const fourStar = reviews.filter((r) => r.rating === 4).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <FlowBadge flow="marketplace" className="mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Customer ratings after marketplace jobs complete
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <Star className="mb-4 h-12 w-12 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700">No reviews yet</h3>
          <p className="mt-1 text-sm text-gray-400">
            Reviews appear when customers rate completed escrow jobs
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-5xl font-extrabold text-gray-900">
                {avg!.toFixed(1)}
              </p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-5 w-5",
                      avg! >= s
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Average · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">5 star</p>
              <p className="mt-1 text-3xl font-extrabold text-[#0B2A4A]">
                {fiveStar}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">4 star</p>
              <p className="mt-1 text-3xl font-extrabold text-[#0B2A4A]">
                {fourStar}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.job.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.client.name.split(" — ")[0]} · {r.job.category} ·{" "}
                      {r.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-3.5 w-3.5",
                          r.rating >= s
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {r.comment ? (
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
