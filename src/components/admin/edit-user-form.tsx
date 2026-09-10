"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { updateUserAction, resetUserPasswordAction } from "@/actions/users";
import {
  STAFF_BASE_ROLE_LABELS,
  modulesFromPermissions,
} from "@/lib/staff-roles";
import {
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle,
  UserRound,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20";

type RoleOption = {
  id: string;
  name: string;
  description: string | null;
  baseRole: string;
  key: string;
  permissions: string[];
};

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  staffRoleId: string | null;
};

export function EditUserForm({ user, roles }: { user: User; roles: RoleOption[] }) {
  const updateBound = updateUserAction.bind(null, user.id);
  const resetBound = resetUserPasswordAction.bind(null, user.id);
  const [updateState, updateAction, updatePending] = useActionState(updateBound, null);
  const [resetState, resetAction, resetPending] = useActionState(resetBound, null);
  const [showPassword, setShowPassword] = useState(false);

  const defaultRoleId =
    user.staffRoleId ??
    roles.find((r) => r.baseRole === user.role)?.id ??
    roles[0]?.id ??
    "";

  const [selectedRoleId, setSelectedRoleId] = useState(defaultRoleId);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );
  const selectedModules = modulesFromPermissions(selectedRole?.permissions ?? []);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      {/* Profile */}
      <form action={updateAction} className="space-y-5">
        <input type="hidden" name="staffRoleId" value={selectedRoleId} />

        {updateState?.error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {updateState.error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Profile details</h2>
              <p className="text-xs text-slate-500">Name, contact and login email</p>
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
                defaultValue={user.name ?? ""}
                placeholder="Full name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Email <span className="text-orange-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={user.email}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Phone
              </label>
              <input
                name="phone"
                defaultValue={user.phone ?? ""}
                placeholder="+91 9876543210"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assign role</h2>
              <p className="text-xs text-slate-500">
                Choose which role / modules this user gets
              </p>
            </div>
          </div>

          {roles.length === 0 ? (
            <p className="text-sm text-red-600">
              No roles found.{" "}
              <Link href="/roles/new" className="font-semibold underline">
                Create a role
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {roles.map((r) => {
                const on = selectedRoleId === r.id;
                const mods = modulesFromPermissions(r.permissions);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleId(r.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      on
                        ? "border-orange-300 bg-orange-50/70 ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {STAFF_BASE_ROLE_LABELS[r.baseRole] ?? r.baseRole}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                          on
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </div>
                    {r.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {r.description}
                      </p>
                    )}
                    {mods.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {mods.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                              on
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {m}
                          </span>
                        ))}
                        {mods.length > 4 && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            +{mods.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/users"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updatePending || !selectedRoleId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60"
          >
            {updatePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
      </form>

      {/* Side panels */}
      <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Role preview
          </p>
          {selectedRole ? (
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-900">{selectedRole.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {STAFF_BASE_ROLE_LABELS[selectedRole.baseRole] ?? selectedRole.baseRole}
              </p>
              {selectedRole.description && (
                <p className="mt-2 text-sm text-slate-600">{selectedRole.description}</p>
              )}
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Modules
              </p>
              {selectedModules.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No modules</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedModules.map((m) => (
                    <span
                      key={m}
                      className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-100"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                {selectedRole.permissions.length} permissions assigned
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Select a role</p>
          )}
        </aside>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Reset password</h2>
              <p className="text-xs text-slate-500">Set a new login password</p>
            </div>
          </div>

          <form action={resetAction} className="mt-4 space-y-3">
            <div className="relative">
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className={cn(inputClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {resetState && "error" in resetState && resetState.error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {resetState.error}
              </p>
            )}
            {resetState && "success" in resetState && resetState.success && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Password updated
              </p>
            )}

            <button
              type="submit"
              disabled={resetPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
            >
              {resetPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
