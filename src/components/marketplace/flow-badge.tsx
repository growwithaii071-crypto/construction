import { cn } from "@/lib/utils";

export function FlowBadge({
  flow,
  className,
}: {
  flow: "marketplace" | "chat";
  className?: string;
}) {
  const isMarket = flow === "marketplace";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isMarket
          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-100"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        className
      )}
      title={
        isMarket
          ? "Escrow jobs: quotes, Stripe pay, protect / dispute"
          : "Service chat: request a listed trader and message"
      }
    >
      {isMarket ? "Marketplace · Escrow" : "Services · Chat"}
    </span>
  );
}
