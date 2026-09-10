"use client";

import { useMemo, useState, useTransition } from "react";
import { updateEmailTemplateAction } from "@/actions/email";
import {
  Loader2,
  Save,
  Search,
  Mail,
  KeyRound,
  ClipboardList,
  CheckCircle2,
  XCircle,
  PlayCircle,
  BadgeCheck,
  MessageSquare,
  Eye,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isActive: boolean;
};

const TEMPLATE_META: Record<
  string,
  { icon: typeof Mail; accent: string; group: string }
> = {
  welcome: { icon: Mail, accent: "bg-sky-50 text-sky-700", group: "Auth" },
  password_reset: { icon: KeyRound, accent: "bg-amber-50 text-amber-700", group: "Auth" },
  service_request_created: {
    icon: ClipboardList,
    accent: "bg-orange-50 text-orange-700",
    group: "Jobs",
  },
  service_request_accepted: {
    icon: CheckCircle2,
    accent: "bg-emerald-50 text-emerald-700",
    group: "Jobs",
  },
  service_request_rejected: {
    icon: XCircle,
    accent: "bg-red-50 text-red-700",
    group: "Jobs",
  },
  service_request_in_progress: {
    icon: PlayCircle,
    accent: "bg-blue-50 text-blue-700",
    group: "Jobs",
  },
  service_request_completed: {
    icon: BadgeCheck,
    accent: "bg-teal-50 text-teal-700",
    group: "Jobs",
  },
  new_message: {
    icon: MessageSquare,
    accent: "bg-indigo-50 text-indigo-700",
    group: "Chat",
  },
};

function metaFor(key: string) {
  return (
    TEMPLATE_META[key] ?? {
      icon: Mail,
      accent: "bg-slate-50 text-slate-700",
      group: "Other",
    }
  );
}

export function EmailTemplatesManager({ templates }: { templates: Template[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Local draft so preview updates live
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];
  const [draft, setDraft] = useState({
    subject: selected?.subject ?? "",
    bodyHtml: selected?.bodyHtml ?? "",
    isActive: selected?.isActive ?? true,
  });

  function selectTemplate(t: Template) {
    setSelectedId(t.id);
    setDraft({
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      isActive: t.isActive,
    });
    setStatus(null);
    setTab("edit");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  }, [templates, query]);

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData();
    fd.set("id", selected.id);
    fd.set("subject", draft.subject);
    fd.set("bodyHtml", draft.bodyHtml);
    if (draft.isActive) fd.set("isActive", "on");
    setStatus(null);
    start(async () => {
      const res = await updateEmailTemplateAction(fd);
      setStatus({ type: res.success ? "ok" : "err", text: res.message });
    });
  }

  async function copyVar(v: string) {
    const token = `{{${v}}}`;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(v);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  }

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
        No templates found. Click Sync Defaults.
      </div>
    );
  }

  const MetaIcon = metaFor(selected.key).icon;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
      {/* Left: template list */}
      <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="max-h-[min(70vh,640px)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-400">No matches</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((t) => {
                const meta = metaFor(t.key);
                const Icon = meta.icon;
                const active = t.id === selected.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectTemplate(t)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        active
                          ? "bg-orange-50 ring-1 ring-orange-200"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          meta.accent
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate text-sm",
                              active ? "font-semibold text-slate-900" : "font-medium text-slate-800"
                            )}
                          >
                            {t.name}
                          </span>
                          <span
                            className={cn(
                              "ml-auto h-1.5 w-1.5 shrink-0 rounded-full",
                              t.isActive ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          />
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">
                          {t.key}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Right: editor */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                metaFor(selected.key).accent
              )}
            >
              <MetaIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">{selected.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {selected.description ?? "System email template"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
                  tab === "edit"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Code2 className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
                  tab === "preview"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-5 p-5">
          {tab === "edit" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Subject line
                </label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-600">HTML body</label>
                  <span className="text-[10px] text-slate-400">
                    Use {"{{variables}}"} from the list below
                  </span>
                </div>
                <textarea
                  value={draft.bodyHtml}
                  onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))}
                  required
                  rows={14}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs leading-relaxed text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">Available variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVar(v)}
                      title="Copy variable"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800"
                    >
                      {copied === v ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Subject
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{draft.subject}</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-xl overflow-hidden rounded-lg bg-white shadow-sm">
                  <div className="bg-[#1e3a5f] px-6 py-5 text-center">
                    <p className="text-lg font-bold text-white">BuildPro</p>
                  </div>
                  <div
                    className="px-6 py-8 text-sm leading-relaxed text-slate-700 [&_a]:inline-block [&_a]:rounded-lg [&_a]:px-4 [&_a]:py-2 [&_a]:font-semibold [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold"
                    dangerouslySetInnerHTML={{ __html: draft.bodyHtml }}
                  />
                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-center text-[11px] text-slate-400">
                    © {new Date().getFullYear()} BuildPro
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
              className="inline-flex items-center gap-2.5 text-sm text-slate-700"
            >
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition",
                  draft.isActive ? "bg-emerald-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                    draft.isActive && "translate-x-4"
                  )}
                />
              </span>
              Template {draft.isActive ? "active" : "disabled"}
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {status && (
                <p
                  className={cn(
                    "text-sm",
                    status.type === "ok" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {status.text}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save template
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
