import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function BilingualAlert({
  tone = "error",
  en,
  hi,
  className,
}: {
  tone?: "error" | "warning" | "info" | "success";
  en: string;
  hi?: string;
  className?: string;
}) {
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    info: "border-blue-100 bg-blue-50 text-[#0B2A4A]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        styles,
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold leading-snug">{en}</p>
        {hi ? <p className="text-xs opacity-90 leading-snug">{hi}</p> : null}
      </div>
    </div>
  );
}
