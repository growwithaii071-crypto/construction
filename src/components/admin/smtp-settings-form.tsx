"use client";

import { useState, useTransition } from "react";
import {
  saveSmtpSettingsAction,
  testSmtpAction,
  sendTestEmailAction,
} from "@/actions/email";
import {
  Loader2,
  Save,
  Wifi,
  Send,
  Server,
  Shield,
  UserRound,
  AtSign,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Smtp = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string | null;
  isActive: boolean;
} | null;

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20";

export function SmtpSettingsForm({
  initial,
  source = "none",
}: {
  initial: Smtp;
  source?: "database" | "env" | "none";
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secure, setSecure] = useState(initial?.secure ?? false);
  const hasStoredPassword = Boolean(initial?.password);

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (secure) fd.set("secure", "on");
    else fd.delete("secure");
    fd.set("source", source);
    setMsg(null);
    start(async () => {
      const res = await saveSmtpSettingsAction(fd);
      setMsg({ type: res.success ? "ok" : "err", text: res.message });
    });
  }

  function onTest() {
    setMsg(null);
    start(async () => {
      const res = await testSmtpAction();
      setMsg({ type: res.success ? "ok" : "err", text: res.message });
    });
  }

  function onSendTest() {
    setMsg(null);
    start(async () => {
      const res = await sendTestEmailAction(testTo);
      setMsg({ type: res.success ? "ok" : "err", text: res.message });
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      {/* Main form — wide */}
      <form
        onSubmit={onSave}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid lg:grid-cols-2">
          {/* Mail server */}
          <div className="border-b border-slate-100 p-5 lg:border-r lg:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Server className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Mail server</h2>
                <p className="text-xs text-slate-500">Host, port and encryption</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  SMTP host
                </label>
                <input
                  name="host"
                  required
                  defaultValue={initial?.host ?? ""}
                  placeholder="smtp.gmail.com"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Port
                  </label>
                  <input
                    name="port"
                    type="number"
                    required
                    defaultValue={initial?.port ?? 587}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => setSecure((v) => !v)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition",
                        secure ? "bg-orange-500" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                          secure && "translate-x-4"
                        )}
                      />
                    </span>
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    SSL
                  </button>
                </div>
              </div>
              {secure && <input type="hidden" name="secure" value="on" />}
              <p className="text-[11px] text-slate-400">
                Port 587 = STARTTLS · Port 465 = SSL/TLS
              </p>
            </div>
          </div>

          {/* Auth */}
          <div className="border-b border-slate-100 p-5 lg:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Authentication</h2>
                <p className="text-xs text-slate-500">SMTP login credentials</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Username
                </label>
                <input
                  name="username"
                  required
                  defaultValue={initial?.username ?? ""}
                  placeholder="your@email.com"
                  className={inputClass}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required={!hasStoredPassword}
                    defaultValue={hasStoredPassword ? "••••••••" : ""}
                    placeholder="App password"
                    className={cn(inputClass, "pr-11")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {hasStoredPassword && (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Leave as dots to keep current password
                    {source === "env" ? " from .env" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sender — full width under the two cols */}
          <div className="border-b border-slate-100 p-5 lg:col-span-2 lg:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <AtSign className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Sender identity</h2>
                <p className="text-xs text-slate-500">Shown in the recipient inbox</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  From email
                </label>
                <input
                  name="fromEmail"
                  type="email"
                  required
                  defaultValue={initial?.fromEmail ?? ""}
                  placeholder="noreply@buildpro.in"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  From name
                </label>
                <input
                  name="fromName"
                  defaultValue={initial?.fromName ?? "BuildPro"}
                  placeholder="BuildPro"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          {msg ? (
            <p
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                msg.type === "ok" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {msg.type === "ok" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {msg.text}
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Save before testing a new host or password.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onTest}
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Test connection
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save SMTP
            </button>
          </div>
        </div>
      </form>

      {/* Right column */}
      <aside className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f]">
              <Send className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send test email</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Uses the Welcome template via current SMTP config.
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className={inputClass}
            />
            <button
              type="button"
              onClick={onSendTest}
              disabled={pending || !testTo}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 text-sm font-semibold text-white transition hover:bg-[#162e4d] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Send test
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900">Gmail tip</h3>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
            <li>
              Host: <span className="font-mono text-slate-700">smtp.gmail.com</span>
            </li>
            <li>
              Port: <span className="font-mono text-slate-700">587</span> (SSL off) or{" "}
              <span className="font-mono text-slate-700">465</span> (SSL on)
            </li>
            <li>Use an App Password, not your normal Gmail password</li>
            <li>After changing values, Save first — then Test connection</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
