import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getJobCategories } from "@/actions/marketplace/jobs";
import { PostJobForm } from "@/components/marketplace/post-job-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Post a Job — BuildPro" };

export default async function NewCustomerJobPage() {
  await requireAuth([UserRole.CLIENT]);
  const categories = await getJobCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href="/customer/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          My Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Post a job</h1>
        <p className="mt-1 text-sm text-slate-500">
          We’ll automatically invite up to 3 matched traders. No charge until you accept a quote.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <PostJobForm categories={categories} />
      </div>
    </div>
  );
}
