import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { User, Lock, Bell, Building2, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

const SETTINGS_ITEMS = [
  {
    icon: User,
    label: "Profile",
    desc: "Update your name, email and phone",
    href: "/settings/profile",
  },
  { icon: Lock, label: "Security", desc: "Change password and 2FA", href: "/settings/security" },
  {
    icon: Bell,
    label: "Notifications",
    desc: "Configure email and push alerts",
    href: "/settings",
  },
  {
    icon: Building2,
    label: "Company Info",
    desc: "Update company details and branding",
    href: "/settings",
  },
];

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and application settings</p>
      </div>

      <div className="max-w-2xl space-y-3">
        {SETTINGS_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
