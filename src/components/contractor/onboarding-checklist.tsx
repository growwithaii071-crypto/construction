import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContractorOnboardingChecklist({
  hasService,
  connectDone,
  feeCardDone,
}: {
  hasService: boolean;
  connectDone: boolean;
  feeCardDone: boolean;
}) {
  const steps = [
    {
      done: hasService,
      label: "Add a service",
      hint: "Category must match customer jobs",
      href: "/construction/services/new",
    },
    {
      done: connectDone,
      label: "Stripe Connect",
      hint: "Identity + bank for payouts",
      href: "/construction/payouts",
    },
    {
      done: feeCardDone,
      label: "Save fee card",
      hint: "Success fee authorization",
      href: "/construction/payouts",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  if (doneCount === steps.length) return null;

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-bold text-[#0B2A4A]">Get ready for jobs</h2>
          <p className="text-xs text-slate-500">
            Service → Connect → Fee card · {doneCount}/{steps.length} done
          </p>
        </div>
        <span className="text-sm font-extrabold text-orange-600">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                s.done
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-slate-200 bg-white hover:border-orange-200"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  s.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Circle className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                <p className="text-[11px] text-slate-500">{s.hint}</p>
              </div>
              {!s.done && (
                <span className="text-xs font-bold text-orange-600">Do it →</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
