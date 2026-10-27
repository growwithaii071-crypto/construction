"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { declineInvitationAction } from "@/actions/marketplace/jobs";
import { Loader2 } from "lucide-react";

export function DeclineInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Decline this job invitation?")) return;
        startTransition(async () => {
          await declineInvitationAction(invitationId);
          router.push("/construction/invitations");
          router.refresh();
        });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Decline
    </button>
  );
}
