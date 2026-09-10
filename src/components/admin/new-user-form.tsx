"use client";

import { useActionState } from "react";
import { createUserAction } from "@/actions/users";
import { STAFF_BASE_ROLE_LABELS } from "@/lib/staff-roles";
import { Loader2 } from "lucide-react";

type RoleOption = {
  id: string;
  name: string;
  description: string | null;
  baseRole: string;
  key: string;
};

export function NewUserForm({ roles }: { roles: RoleOption[] }) {
  const [state, formAction, pending] = useActionState(createUserAction, null);
  const defaultRole =
    roles.find((r) => r.key === "employee")?.id ??
    roles.find((r) => r.key === "manager")?.id ??
    roles[0]?.id ??
    "";

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">User details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Full name *
            </label>
            <input
              name="name"
              required
              placeholder="Rajesh Verma"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="manager@buildpro.com"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Password *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Phone
            </label>
            <input
              name="phone"
              placeholder="+91 9876543210"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Role *
            </label>
            {roles.length === 0 ? (
              <p className="text-sm text-red-600">
                No roles found. Create a role first under Roles.
              </p>
            ) : (
              <select
                name="staffRoleId"
                required
                defaultValue={defaultRole}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.description ? ` — ${r.description}` : ""} (
                    {STAFF_BASE_ROLE_LABELS[r.baseRole] ?? r.baseRole})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || roles.length === 0}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create user
      </button>
    </form>
  );
}
