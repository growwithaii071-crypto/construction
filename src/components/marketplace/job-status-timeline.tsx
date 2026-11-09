import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "posted", label: "Posted" },
  { key: "quotes", label: "Quotes" },
  { key: "awarded", label: "Awarded" },
  { key: "done", label: "Done" },
] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "OPEN":
      return 0;
    case "QUOTES_RECEIVED":
    case "AWAITING_PAYMENT":
      return 1;
    case "AWARDED":
    case "FUNDED":
    case "IN_PROGRESS":
    case "DISPUTED":
      return 2;
    case "COMPLETED":
    case "PAID_OUT":
    case "RESOLVED":
      return 3;
    default:
      return 0;
  }
}

export function JobStatusTimeline({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  if (status === "CANCELLED" || status === "EXPIRED") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600",
          className
        )}
      >
        Job {status.toLowerCase()} · जॉब {status === "CANCELLED" ? "रद्द" : "समय समाप्त"}
      </div>
    );
  }

  const active = stepIndex(status);
  const fullyDone = status === "PAID_OUT" || status === "RESOLVED";
  const disputed = status === "DISPUTED";

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Progress
        </p>
        {disputed && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            Dispute hold · विवाद लंबित
          </span>
        )}
      </div>
      <ol className="flex items-start justify-between gap-1">
        {STEPS.map((step, i) => {
          const complete = fullyDone || i < active;
          const current = !fullyDone && i === active;

          return (
            <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "absolute top-3.5 left-1/2 h-0.5 w-full",
                    i < active || fullyDone ? "bg-orange-500" : "bg-slate-200"
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white",
                  complete
                    ? "bg-orange-500 text-white"
                    : current
                      ? "bg-[#0B2A4A] text-white"
                      : "bg-slate-200 text-slate-500"
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-[11px] font-bold sm:text-xs",
                  current || complete ? "text-[#0B2A4A]" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        Posted → Quotes → Awarded → Done
      </p>
    </div>
  );
}
