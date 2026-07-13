"use client";

import { useState, useTransition } from "react";
import { requestServiceAction } from "@/actions/services/request-service";
import { Loader2, Send, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

interface ServiceRequestFormProps {
  serviceId: string;
  serviceTitle: string;
}

export function ServiceRequestForm({ serviceId, serviceTitle }: ServiceRequestFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      serviceId,
      message: fd.get("message") as string,
      location: fd.get("location") as string,
      budget: fd.get("budget") ? Number(fd.get("budget")) : undefined,
    };

    startTransition(async () => {
      const result = await requestServiceAction(data);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-semibold py-1">
        <CheckCircle2 className="w-4 h-4" />
        Request Sent!
      </div>
    );
  }

  return (
    <div>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Request This Service
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Request Details</p>
            <button type="button" onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <textarea
            name="message"
            rows={3}
            placeholder="Describe your requirement… (optional)"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <input
            name="location"
            placeholder="Your location / city (optional)"
            className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            name="budget"
            type="number"
            min="0"
            placeholder="Your budget in ₹ (optional)"
            className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Request</>}
          </button>
        </form>
      )}
    </div>
  );
}
