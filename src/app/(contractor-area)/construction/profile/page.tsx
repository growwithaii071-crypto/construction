import { auth } from "@/auth";
import { Mail, Phone, User, Shield, HardHat, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile — BuildPro Contractor" };

export default async function ContractorProfilePage() {
  const session = await auth();
  const user = session?.user;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "C";

  // Name may be stored as "PersonName — CompanyName"
  const parts = user?.name?.split(" — ");
  const personName = parts?.[0] ?? user?.name ?? "—";
  const companyName = parts?.[1] ?? "—";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your contractor account details on BuildPro.</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{personName}</h2>
          {companyName !== "—" && (
            <p className="text-sm text-gray-500 mt-0.5">{companyName}</p>
          )}
          <span className="inline-block text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full mt-1">
            Contractor
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Account Information</h3>
        <div className="space-y-4">
          {[
            { icon: User, label: "Full Name", value: personName },
            { icon: HardHat, label: "Company / Trade Name", value: companyName },
            { icon: Mail, label: "Email Address", value: user?.email ?? "—" },
            { icon: Shield, label: "Account Role", value: "Contractor" },
            { icon: Calendar, label: "Account Status", value: "Active & Verified" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-800 mb-2">Need help?</h3>
        <p className="text-sm text-gray-500 mb-3">Our support team is available Mon–Sat, 9AM–6PM.</p>
        <div className="flex flex-wrap gap-4 text-sm text-orange-700 font-medium">
          <a href="mailto:support@buildpro.in" className="flex items-center gap-1.5 hover:text-orange-900">
            <Mail className="w-4 h-4" /> support@buildpro.in
          </a>
          <a href="tel:+919876543210" className="flex items-center gap-1.5 hover:text-orange-900">
            <Phone className="w-4 h-4" /> +91 98765 43210
          </a>
        </div>
      </div>
    </div>
  );
}
