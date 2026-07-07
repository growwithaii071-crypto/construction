"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { updateProfileAction, changePasswordAction } from "@/actions/users";
import { Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [profilePending, setProfilePending] = useState(false);
  const [pwPending, setPwPending] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfilePending(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateProfileAction(user!.id, fd);
    setProfileMsg(
      result?.success
        ? { type: "success", msg: "Profile updated!" }
        : { type: "error", msg: "Failed to update" }
    );
    setProfilePending(false);
    await update();
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await changePasswordAction(user!.id, fd);
    if (result?.error) setPwMsg({ type: "error", msg: result.error });
    else setPwMsg({ type: "success", msg: "Password changed!" });
    setPwPending(false);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Update your personal information</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Avatar */}
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-[#1e3a5f] text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="text-xs text-orange-500 font-medium mt-1">{user?.role}</p>
            </div>
          </div>
        </Card>

        {/* Profile form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
          </CardHeader>
          <CardContent>
            {profileMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {profileMsg.type === "success" && <CheckCircle className="w-4 h-4" />}
                {profileMsg.msg}
              </div>
            )}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input name="name" defaultValue={user?.name ?? ""} required className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={user?.email ?? ""}
                  readOnly
                  className="mt-1 bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  defaultValue={user?.phone ?? ""}
                  placeholder="+91 9876543210"
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={profilePending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {profilePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            {pwMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${pwMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {pwMsg.type === "success" && <CheckCircle className="w-4 h-4" />}
                {pwMsg.msg}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input name="currentPassword" type="password" required className="mt-1" />
              </div>
              <div>
                <Label>New Password</Label>
                <Input name="newPassword" type="password" required minLength={8} className="mt-1" />
              </div>
              <Button type="submit" disabled={pwPending} variant="outline">
                {pwPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
