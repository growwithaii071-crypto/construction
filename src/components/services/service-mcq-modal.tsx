"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getQuestionsForCategory } from "./service-questions";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  priceUnit?: string | null;
  contractor: { name: string };
};

type Props = {
  service: Service;
  isLoggedIn: boolean;
  onClose: () => void;
  /** Auto-submit pending answers after login/register */
  autoSubmitPending?: boolean;
};

const STEPS = ["questions", "review", "done"] as const;
const PENDING_KEY = "pendingServiceRequest";

export function ServiceMCQModal({
  service,
  isLoggedIn,
  onClose,
  autoSubmitPending = false,
}: Props) {
  const router = useRouter();
  const questions = getQuestionsForCategory(service.category);
  const [step, setStep] = useState<(typeof STEPS)[number]>("questions");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const autoRan = useRef(false);

  const q = questions[current];
  const totalQ = questions.length;
  const allAnswered = questions.every((qq) => answers[qq.id]);
  const contractorName = service.contractor.name.split(" — ")[0];

  // Restore pending answers + optionally auto-submit after auth
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        serviceId: string;
        answers?: Record<string, string>;
        location?: string;
        budget?: string;
        message?: string;
      };
      if (pending.serviceId !== service.id) return;
      if (pending.answers) setAnswers(pending.answers);
      if (pending.location) setLocation(pending.location);
      if (pending.budget) setBudget(pending.budget);
      if (pending.message) setMessage(pending.message);
      setStep("review");
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
  }, [service.id]);

  useEffect(() => {
    if (!autoSubmitPending || !isLoggedIn || autoRan.current) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.serviceId !== service.id) return;
      autoRan.current = true;
      void submitRequest(pending.answers ?? answers, pending.location ?? location, pending.budget ?? budget, pending.message ?? message);
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmitPending, isLoggedIn, service.id]);

  function selectOption(option: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    if (current < totalQ - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 300);
    }
  }

  function savePending() {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        serviceId: service.id,
        answers,
        location,
        budget,
        message,
      })
    );
  }

  async function submitRequest(
    ans: Record<string, string> = answers,
    loc = location,
    bud = budget,
    notes = message
  ) {
    setLoading(true);
    setError(null);

    const mcqSummary = questions
      .map((qq) => `${qq.question}: ${ans[qq.id] ?? "—"}`)
      .join("\n");
    const fullMessage = `${mcqSummary}${notes ? `\n\nAdditional notes: ${notes}` : ""}`;

    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          message: fullMessage,
          location: loc,
          budget: bud ? parseFloat(String(bud).replace(/[^0-9.]/g, "")) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.requestId) {
        localStorage.removeItem(PENDING_KEY);
        setRequestId(data.requestId);
        setStep("done");
        // Go straight to chat with this trader
        router.push(`/customer/messages/${data.requestId}`);
        return;
      }
      if (data.requiresLogin) {
        savePending();
        router.push(`/login?callbackUrl=${encodeURIComponent("/services?resume=1")}`);
        return;
      }
      setError(data.message ?? "Something went wrong.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium text-gray-400">{service.category}</p>
            <h3 className="mt-0.5 truncate text-base leading-snug font-bold text-gray-900">
              {service.title}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Trade person: <span className="font-semibold">{contractorName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "questions" && (
          <div className="px-6 pt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                Question {current + 1} of {totalQ}
              </p>
              <p className="text-xs text-gray-400">
                {Object.keys(answers).length}/{totalQ} answered
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${((current + 1) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {step === "questions" && (
            <div>
              <p className="mb-4 text-lg font-bold text-gray-900">
                {q.emoji} {q.question}
              </p>
              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => selectOption(opt)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        selected
                          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      )}
                    >
                      {selected && <span className="mr-2">✓</span>}
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {current < totalQ - 1 ? (
                  <button
                    onClick={() => answers[q.id] && setCurrent((c) => c + 1)}
                    disabled={!answers[q.id]}
                    className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 disabled:opacity-30"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => allAnswered && setStep("review")}
                    disabled={!allAnswered}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
                  >
                    Continue to message <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900">Message this trade person</h4>
                <p className="mt-0.5 text-xs text-gray-500">
                  Flow: select trader → login/create account → send message
                </p>
              </div>

              <div className="space-y-2.5 rounded-xl bg-gray-50 p-4">
                {questions.map((qq) => (
                  <div key={qq.id} className="flex items-start gap-2">
                    <span className="shrink-0 text-base">{qq.emoji}</span>
                    <div>
                      <p className="text-xs text-gray-400">{qq.question}</p>
                      <p className="text-sm font-semibold text-gray-800">{answers[qq.id]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    📍 Work location <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Andheri West, Mumbai"
                    className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    💬 Your message to {contractorName}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Hi, I need help with…"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
              )}

              {isLoggedIn ? (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setStep("questions")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => void submitRequest()}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" /> Send message
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-center text-xs text-gray-500">
                    Create login or sign in to message <strong>{contractorName}</strong>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        savePending();
                        router.push(
                          `/customer/register?callbackUrl=${encodeURIComponent("/services?resume=1")}`
                        );
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 text-sm font-bold text-violet-700 hover:bg-violet-100"
                    >
                      <UserPlus className="h-4 w-4" /> Create account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        savePending();
                        router.push(
                          `/login?callbackUrl=${encodeURIComponent("/services?resume=1")}`
                        );
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
                    >
                      <LogIn className="h-4 w-4" /> Login & message
                    </button>
                  </div>
                  <button
                    onClick={() => setStep("questions")}
                    className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600"
                  >
                    ← Edit answers
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="text-xl font-extrabold text-gray-900">Message sent!</h4>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                Opening chat with <strong>{contractorName}</strong>…
              </p>
              {requestId && (
                <Link
                  href={`/customer/messages/${requestId}`}
                  className="mt-5 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                >
                  Open chat
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
