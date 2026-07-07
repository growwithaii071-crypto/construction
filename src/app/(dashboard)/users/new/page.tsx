"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction } from "@/actions/users";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "SITE_ENGINEER", label: "Site Engineer" },
  { value: "FOREMAN", label: "Foreman" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "VIEWER", label: "Viewer" },
];

export default function NewUserPage() {
  const [state, formAction, isPending] = useActionState(createUserAction, null);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add Team Member</h1>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 max-w-lg">
          {state.error}
        </div>
      )}

      <form action={formAction} className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input name="name" required placeholder="John Doe" className="mt-1" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                name="password"
                type="password"
                required
                placeholder="Min 8 characters"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" placeholder="+91 9876543210" className="mt-1" />
            </div>
            <div>
              <Label>Role *</Label>
              <Select name="role" defaultValue="VIEWER">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
