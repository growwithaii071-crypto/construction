"use client";

import { useActionState, useState } from "react";
import {
  updateContractorProfileAction,
  resetPortalPasswordAction,
} from "@/actions/portal-profiles";
import { Loader2, Save, HardHat, KeyRound, AlertCircle, CheckCircle } from "lucide-react";

type ContractorUser = {
  id: string;
  personName: string;
  companyName: string;
  email: string;
  phone: string | null;
  specialization: string;
  licenseNumber: string;
  isActive: boolean;
};

export function EditContractorProfileForm({ contractor }: { contractor: ContractorUser }) {
  const profileBound = updateContractorProfileAction.bind(null, contractor.id);
  const passwordBound = resetPortalPasswordAction.bind(null, contractor.id);
  const [profileState, profileAction, profilePending] = useActionState(profileBound, null);
  const [pwdState, pwdAction, pwdPending] = useActionState(passwordBound, null);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <form action={profileAction} className="space-y-5">
        {profileState?.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileState.error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <HardHat className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Contractor profile</h2>
              <p className="text-xs text-slate-500">Contact and company details</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Contact name *
              </label>
              <input
                name="name"
                required
                defaultValue={contractor.personName}
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Company name *
              </label>
              <input
                name="companyName"
                required
                defaultValue={contractor.companyName}
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
                defaultValue={contractor.email}
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Phone
              </label>
              <input
                name="phone"
                defaultValue={contractor.phone ?? ""}
                placeholder="+91 9876543210"
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Specialization
              </label>
              <input
                name="specialization"
                defaultValue={contractor.specialization}
                placeholder="Civil, Plumbing, Electrical"
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                License number
              </label>
              <input
                name="licenseNumber"
                defaultValue={contractor.licenseNumber}
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={contractor.isActive}
                  className="rounded border-slate-300"
                />
                Account active
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={profilePending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {profilePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save profile
        </button>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Password</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            {showPwd ? "Hide" : "Reset"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Set a new login password for this contractor.
        </p>

        {showPwd && (
          <form action={pwdAction} className="mt-4 space-y-3">
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              placeholder="New password (min 8 chars)"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
            />
            {pwdState && "error" in pwdState && pwdState.error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {pwdState.error}
              </p>
            )}
            {pwdState && "success" in pwdState && pwdState.success && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                {pwdState.message}
              </p>
            )}
            <button
              type="submit"
              disabled={pwdPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
            >
              {pwdPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
