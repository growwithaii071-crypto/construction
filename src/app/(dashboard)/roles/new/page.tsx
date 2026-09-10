"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createStaffRoleAction } from "@/actions/roles";
import {
  STAFF_BASE_ROLES,
  STAFF_BASE_ROLE_LABELS,
  permissionsByModule,
  modulesFromPermissions,
} from "@/lib/staff-roles";
import {
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20";

export default function NewRolePage() {
  const [state, formAction, pending] = useActionState(createStaffRoleAction, null);
  const [perms, setPerms] = useState<string[]>(["dashboard.view", "projects.view"]);
  const modules = useMemo(() => permissionsByModule(), []);
  const selectedModules = modulesFromPermissions(perms);

  function togglePerm(key: string) {
    setPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function toggleModule(moduleKeys: string[]) {
    const allOn = moduleKeys.every((k) => perms.includes(k));
    setPerms((prev) =>
      allOn
        ? prev.filter((p) => !moduleKeys.includes(p))
        : Array.from(new Set([...prev, ...moduleKeys]))
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create role</h1>
            <p className="text-sm text-slate-500">
              Name the role, set access level, then pick modules
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 font-semibold text-orange-700">
            <LayoutGrid className="h-3.5 w-3.5" />
            {selectedModules.length} modules
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
            {perms.length} permissions
          </span>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {perms.map((p) => (
          <input key={p} type="hidden" name="permissions" value={p} />
        ))}

        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* Left: details + summary */}
          <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
                  <Shield className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Role details</h2>
                  <p className="text-xs text-slate-500">Basic identity & access</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Role name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Site Supervisor"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Short note on what this role does…"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Access level <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="baseRole"
                    required
                    defaultValue="PROJECT_MANAGER"
                    className={cn(inputClass, "bg-white")}
                  >
                    {STAFF_BASE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {STAFF_BASE_ROLE_LABELS[r] ?? r}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                    System access tier used for dashboard areas this role can open.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Selected modules
              </p>
              {selectedModules.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  Pick modules on the right →
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
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
            </section>

            <div className="hidden gap-3 xl:flex">
              <Link
                href="/roles"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={pending || perms.length === 0}
                className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create role
              </button>
            </div>
          </div>

          {/* Right: modules */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Modules & permissions</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Toggle a module header to select all of its permissions
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map(({ module, permissions }) => {
                const keys = permissions.map((p) => p.key);
                const selectedCount = keys.filter((k) => perms.includes(k)).length;
                const allOn = selectedCount === keys.length;
                const someOn = selectedCount > 0 && !allOn;

                return (
                  <div
                    key={module}
                    className={cn(
                      "overflow-hidden rounded-2xl border transition",
                      allOn
                        ? "border-orange-200 bg-orange-50/40"
                        : someOn
                          ? "border-orange-100 bg-white"
                          : "border-slate-200 bg-white"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleModule(keys)}
                      className="flex w-full items-center justify-between gap-2 border-b border-inherit px-4 py-3 text-left hover:bg-slate-50/80"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{module}</p>
                        <p className="text-[11px] text-slate-400">
                          {selectedCount}/{keys.length} selected
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                          allOn
                            ? "border-orange-500 bg-orange-500 text-white"
                            : someOn
                              ? "border-orange-300 bg-orange-100 text-orange-600"
                              : "border-slate-200 bg-white text-transparent"
                        )}
                      >
                        {(allOn || someOn) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </button>

                    <ul className="divide-y divide-slate-100">
                      {permissions.map((p) => {
                        const on = perms.includes(p.key);
                        return (
                          <li key={p.key}>
                            <button
                              type="button"
                              onClick={() => togglePerm(p.key)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50/80"
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                                  on
                                    ? "border-orange-500 bg-orange-500 text-white"
                                    : "border-slate-200 bg-white"
                                )}
                              >
                                {on && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                              <span
                                className={cn(
                                  "text-sm",
                                  on ? "font-medium text-slate-900" : "text-slate-600"
                                )}
                              >
                                {p.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Mobile actions */}
        <div className="flex gap-3 xl:hidden">
          <Link
            href="/roles"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || perms.length === 0}
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create role
          </button>
        </div>
      </form>
    </div>
  );
}
