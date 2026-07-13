"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction, resetUserPasswordAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "text-red-600" },
  { value: "ADMIN", label: "Admin", color: "text-red-500" },
  { value: "PROJECT_MANAGER", label: "Project Manager", color: "text-blue-600" },
  { value: "SITE_ENGINEER", label: "Site Engineer", color: "text-purple-600" },
  { value: "ACCOUNTANT", label: "Accountant", color: "text-green-600" },
  { value: "FOREMAN", label: "Foreman", color: "text-orange-600" },
  { value: "CONTRACTOR", label: "Contractor", color: "text-yellow-600" },
  { value: "CLIENT", label: "Client", color: "text-cyan-600" },
  { value: "VIEWER", label: "Viewer", color: "text-gray-500" },
];

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: Date | null;
};

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [userId, setUserId] = useState("");

  const updateAction = updateUserAction.bind(null, userId);
  const resetPwdAction = resetUserPasswordAction.bind(null, userId);

  const [updateState, updateFormAction, updatePending] = useActionState(updateAction, null);
  const [resetState, resetFormAction, resetPending] = useActionState(resetPwdAction, null);

  useEffect(() => {
    params.then(({ id }) => {
      setUserId(id);
      fetch(`/api/users/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setUser(data);
          setSelectedRole(data.role);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">User not found.</p>
        <Link href="/users" className="text-orange-500 underline mt-2 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Main Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Details & Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFormAction} className="space-y-4">
            <input type="hidden" name="role" value={selectedRole} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={user.name ?? ""} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(v) => v && setSelectedRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className={r.color}>{r.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Role determines what pages and actions the user can access.
              </p>
            </div>

            {/* Role Permission Preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700 mb-2">
                Access Preview — {ROLES.find((r) => r.value === selectedRole)?.label}
              </p>
              {selectedRole === "SUPER_ADMIN" && (
                <p>✅ All permissions including user management and system settings</p>
              )}
              {selectedRole === "ADMIN" && <p>✅ Full access: Users, Projects, Finance, Reports</p>}
              {selectedRole === "PROJECT_MANAGER" && (
                <p>✅ Projects, Tasks, Contractors, Reports, limited Finance</p>
              )}
              {selectedRole === "SITE_ENGINEER" && <p>✅ Site Reports, Issues, Tasks, Materials</p>}
              {selectedRole === "ACCOUNTANT" && <p>✅ Invoices, Payments, Expenses only</p>}
              {selectedRole === "FOREMAN" && <p>✅ Tasks, Site Reports, Issues</p>}
              {selectedRole === "CONTRACTOR" && <p>✅ View assigned projects and tasks</p>}
              {selectedRole === "CLIENT" && <p>✅ View project status and invoices</p>}
              {selectedRole === "VIEWER" && <p>✅ Read-only access to dashboard</p>}
            </div>

            {updateState && "error" in updateState && updateState.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {updateState.error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={updatePending}
                className="bg-orange-500 hover:bg-orange-600 flex-1"
              >
                {updatePending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/users")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reset Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Reset Password
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowResetPwd(!showResetPwd)}>
              {showResetPwd ? "Hide" : "Set New Password"}
            </Button>
          </div>
        </CardHeader>
        {showResetPwd && (
          <CardContent>
            <form action={resetFormAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              {resetState && "error" in resetState && resetState.error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" /> {resetState.error}
                </div>
              )}
              {resetState && "success" in resetState && resetState.success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> Password updated successfully!
                </div>
              )}

              <Button
                type="submit"
                disabled={resetPending}
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                {resetPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Update Password
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
