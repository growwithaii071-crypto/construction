import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews — BuildPro Contractor" };

async function getReviewsData(userId: string) {
  try {
    const completed = await prisma.serviceRequest.findMany({
      where: { service: { contractorId: userId }, status: "COMPLETED" },
      include: {
        service: { select: { title: true, category: true } },
        client: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return completed;
  } catch {
    return [];
  }
}

// Deterministic star rating based on request id (demo)
function getRating(id: string): number {
  const chars = id.split("").map((c) => c.charCodeAt(0));
  const sum = chars.reduce((a, b) => a + b, 0);
  return 4 + (sum % 2 === 0 ? 1 : 0); // returns 4 or 5
}

function getReviewMessage(id: string, serviceName: string): string {
  const messages = [
    `Excellent work on the ${serviceName}. Very professional and on time!`,
    `Highly recommend! The ${serviceName} was done perfectly.`,
    `Great quality work. Will definitely hire again for ${serviceName}.`,
    `Very satisfied with the ${serviceName}. Clean and efficient.`,
    `Outstanding service! The team was punctual and the ${serviceName} exceeded expectations.`,
  ];
  const chars = id.split("").map((c) => c.charCodeAt(0));
  const sum = chars.reduce((a, b) => a + b, 0);
  return messages[sum % messages.length];
}

export default async function ReviewsPage() {
  const session = await auth();
  const reviews = await getReviewsData(session?.user?.id ?? "");

  const totalRating = reviews.reduce((sum, r) => sum + getRating(r.id), 0);
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "—";
  const fiveStar = reviews.filter((r) => getRating(r.id) === 5).length;
  const fourStar = reviews.filter((r) => getRating(r.id) === 4).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-0.5">Feedback from customers on completed jobs</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-16 flex flex-col items-center text-center">
          <Star className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-700 text-lg">No reviews yet</h3>
          <p className="text-sm text-gray-400 mt-1">Reviews appear here once you complete customer jobs</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average rating */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
              <p className="text-5xl font-extrabold text-gray-900">{avgRating}</p>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-5 h-5", parseFloat(String(avgRating)) >= s ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Average rating</p>
            </div>

            {/* Rating breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Rating Breakdown</p>
              {[
                { stars: 5, count: fiveStar },
                { stars: 4, count: fourStar },
                { stars: 3, count: 0 },
                { stars: 2, count: 0 },
                { stars: 1, count: 0 },
              ].map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-500 w-3">{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: reviews.length > 0 ? `${Math.round((count / reviews.length) * 100)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-4">{count}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{reviews.length}</p>
                  <p className="text-xs text-gray-400">Total reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{fiveStar}</p>
                  <p className="text-xs text-gray-400">5-star reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => {
              const rating = getRating(r.id);
              const message = getReviewMessage(r.id, r.service.title);
              const initials = r.client.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() ?? "C";
              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{r.client.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.service.title}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-3.5 h-3.5", rating >= s ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">"{message}"</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full">{r.service.category}</span>
                    <span className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
