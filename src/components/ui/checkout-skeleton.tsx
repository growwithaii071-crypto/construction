export function CheckoutSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="h-28 rounded-xl bg-slate-100" />
      <div className="h-12 rounded-xl bg-orange-100" />
      <p className="text-center text-xs text-slate-400">
        Preparing secure checkout… · सुरक्षित भुगतान तैयार हो रहा है…
      </p>
    </div>
  );
}

export function ConnectSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-3 w-56 rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-24 rounded-xl bg-slate-100" />
      <p className="text-center text-xs text-slate-400">
        Loading Stripe Connect… · कनेक्ट लोड हो रहा है…
      </p>
    </div>
  );
}
