"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { updateProfileAction, changePasswordAction } from "@/actions/users";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserRound,
  KeyRound,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [profilePending, setProfilePending] = useState(false);
  const [pwPending, setPwPending] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) return;
    setProfilePending(true);
    setProfileMsg(null);
    const fd = new FormData(e.currentTarget);
    const result = await updateProfileAction(user.id, fd);
    setProfileMsg(
      result?.success
        ? { type: "success", msg: "Profile updated" }
        : { type: "error", msg: "Failed to update profile" }
    );
    setProfilePending(false);
    await update();
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) return;
    setPwPending(true);
    setPwMsg(null);
    const fd = new FormData(e.currentTarget);
    const result = await changePasswordAction(user.id, fd);
    if (result?.error) setPwMsg({ type: "error", msg: result.error });
    else {
      setPwMsg({ type: "success", msg: "Password changed" });
      e.currentTarget.reset();
    }
    setPwPending(false);
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/settings"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-sm shadow-orange-500/25">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {user?.name ?? "Profile"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {user?.email}
                {user?.role ? ` · ${String(user.role).replaceAll("_", " ")}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {profileMsg && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
                profileMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {profileMsg.msg}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
                <UserRound className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Basic info</h2>
                <p className="text-xs text-slate-500">Name and contact details</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Full name <span className="text-orange-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  defaultValue={user?.name ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Email
                </label>
                <input
                  value={user?.email ?? ""}
                  readOnly
                  className={cn(inputClass, "cursor-not-allowed bg-slate-50 text-slate-500")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={user?.phone ?? ""}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={profilePending || !user?.id}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60"
          >
            {profilePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save profile
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Change password</h2>
              <p className="text-xs text-slate-500">Update your login password</p>
            </div>
          </div>

          {pwMsg && (
            <div
              className={cn(
                "mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                pwMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {pwMsg.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {pwMsg.msg}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Current password
              </label>
              <div className="relative">
                <input
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  required
                  className={cn(inputClass, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle current password"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                New password
              </label>
              <div className="relative">
                <input
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className={cn(inputClass, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle new password"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={pwPending || !user?.id}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
            >
              {pwPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
