"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle2, Loader2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { getQuestionsForCategory } from "./service-questions";
import { useRouter } from "next/navigation";

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
};

const STEPS = ["questions", "review", "done"] as const;

export function ServiceMCQModal({ service, isLoggedIn, onClose }: Props) {
  const router = useRouter();
  const questions = getQuestionsForCategory(service.category);
  const [step, setStep] = useState<(typeof STEPS)[number]>("questions");
  const [current, setCurrent] = useState(0); // current question index
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = questions[current];
  const totalQ = questions.length;
  const allAnswered = questions.every((q) => answers[q.id]);

  function selectOption(option: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    // Auto-advance to next question after short delay
    if (current < totalQ - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 300);
    }
  }

  function handleContinue() {
    if (!allAnswered) return;
    setStep("review");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    // Build message from MCQ answers
    const mcqSummary = questions
      .map((q) => `${q.question}: ${answers[q.id]}`)
      .join("\n");
    const fullMessage = `${mcqSummary}${message ? `\n\nAdditional notes: ${message}` : ""}`;

    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          message: fullMessage,
          location,
          budget: budget ? parseFloat(budget.replace(/[^0-9.]/g, "")) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep("done");
      } else if (data.requiresLogin) {
        // Save state to localStorage and redirect to login
        localStorage.setItem(
          "pendingServiceRequest",
          JSON.stringify({ serviceId: service.id, answers, location, budget, message })
        );
        router.push(`/login?callbackUrl=/services`);
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const contractorName = service.contractor.name.split(" — ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="min-w-0 pr-4">
            <p className="text-xs text-gray-400 font-medium">{service.category}</p>
            <h3 className="font-bold text-gray-900 text-base leading-snug mt-0.5 truncate">{service.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">by <span className="font-semibold">{contractorName}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        {step === "questions" && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">Question {current + 1} of {totalQ}</p>
              <p className="text-xs text-gray-400">{Object.keys(answers).length}/{totalQ} answered</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${((current + 1) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {/* ── QUESTIONS STEP ── */}
          {step === "questions" && (
            <div>
              <p className="text-lg font-bold text-gray-900 mb-4">
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
                        "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                        selected
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      )}
                    >
                      {selected && <span className="mr-2">✓</span>}
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {current < totalQ - 1 ? (
                  <button
                    onClick={() => answers[q.id] && setCurrent((c) => c + 1)}
                    disabled={!answers[q.id]}
                    className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-30 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleContinue}
                    disabled={!allAnswered}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-colors"
                  >
                    Review & Submit <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── REVIEW STEP ── */}
          {step === "review" && (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Review your answers</h4>

              {/* MCQ summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-start gap-2">
                    <span className="text-base shrink-0">{q.emoji}</span>
                    <div>
                      <p className="text-xs text-gray-400">{q.question}</p>
                      <p className="text-sm font-semibold text-gray-800">{answers[q.id]}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional extra fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">📍 Work Location <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Andheri West, Mumbai"
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">💬 Additional notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Any specific requirements..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep("questions")} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Edit
                </button>

                {isLoggedIn ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send Request ✉️"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      localStorage.setItem(
                        "pendingServiceRequest",
                        JSON.stringify({ serviceId: service.id, answers, location, budget, message })
                      );
                      router.push(`/login?callbackUrl=/services`);
                    }}
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Login & Send
                  </button>
                )}
              </div>

              {!isLoggedIn && (
                <p className="text-xs text-center text-gray-400">
                  Your answers will be saved. After login you can submit directly.
                </p>
              )}
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h4 className="text-xl font-extrabold text-gray-900">Request Sent! 🎉</h4>
              <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
                Your request has been sent to <strong>{contractorName}</strong>. They will review and respond soon.
              </p>
              <p className="mt-3 text-xs text-gray-400">Check status in your dashboard → My Requests</p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
