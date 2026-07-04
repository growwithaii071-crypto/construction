import type { Metadata } from "next";
import Image from "next/image";
import { HardHat } from "lucide-react";

export const metadata: Metadata = {
  title: "Authentication — Construction Co.",
  description: "Sign in to your Construction Management account",
};

const HERO_STATS = [
  { value: "500+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "15+", label: "Years Experience" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 bg-[#0f2137] overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2137] via-[#1a3a5c] to-[#0d3057] opacity-95" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Construction Co.</p>
            <p className="text-blue-300 text-xs mt-0.5">Management System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Build Smarter,
              <br />
              <span className="text-orange-400">Deliver Better.</span>
            </h1>
            <p className="mt-4 text-blue-200 text-lg leading-relaxed max-w-md">
              Manage projects, track progress, coordinate teams, and deliver construction projects
              on time and within budget.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Real-time project tracking & milestones",
              "Contractor & material management",
              "Automated invoicing & payment tracking",
              "Site reports & issue management",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-orange-500/20 border border-orange-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {HERO_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-white dark:bg-gray-950">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 p-6 border-b border-gray-100">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Construction Co.</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="text-center text-xs text-gray-400 p-4">
          © {new Date().getFullYear()} Construction Co. All rights reserved.
        </p>
      </div>
    </div>
  );
}
