"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminRefundPaymentAction } from "@/actions/admin/transactions";

export function RefundPaymentButton({
  paymentId,
  disabled,
}: {
  paymentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        if (!confirm("Refund this payment in Stripe? This cannot be undone easily.")) {
          return;
        }
        startTransition(async () => {
          const res = await adminRefundPaymentAction(paymentId);
          alert(res.message);
          router.refresh();
        });
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Refund
    </button>
  );
}
