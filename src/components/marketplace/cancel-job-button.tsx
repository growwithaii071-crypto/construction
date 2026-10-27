"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelJobAction } from "@/actions/marketplace/jobs";
import { Loader2 } from "lucide-react";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this job? Live invitations will expire.")) return;
        startTransition(async () => {
          await cancelJobAction(jobId);
          router.refresh();
        });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Cancel job
    </button>
  );
}
