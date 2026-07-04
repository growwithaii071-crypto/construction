import { requireAuth, ROLE_LABELS } from "@/lib/auth-utils";
import { logoutAction } from "@/actions/auth/logout";
import { UserRole } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardHat, LogOut, User } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const { user } = session;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-none">Construction Co.</p>
              <p className="text-xs text-gray-400 mt-0.5">Management System</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-[#1e3a5f] rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name?.split(" ")[0]}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[user.role as UserRole]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { label: "Role", value: ROLE_LABELS[user.role as UserRole], color: "bg-blue-50 text-blue-700" },
              { label: "Email Verified", value: user.emailVerified ? "Yes" : "Pending", color: user.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700" },
              { label: "Account Status", value: "Active", color: "bg-green-50 text-green-700" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${item.color}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-gray-400 text-center">
            Dashboard under construction — more features coming in the next phases.
          </p>
        </div>
      </main>
    </div>
  );
}
