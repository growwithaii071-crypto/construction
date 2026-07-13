import type { Metadata } from "next";
import Link from "next/link";
import { HardHat, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Contractor Portal — BuildPro",
  description: "Sign in or register your construction company on BuildPro",
};

const FEATURES = [
  "Browse & bid on new construction projects",
  "Manage your entire team in one place",
  "Submit site reports & progress updates",
  "Automated billing & payment collection",
  "Equipment & material inventory tracking",
  "Client communication & document sharing",
];

const STATS = [
  { value: "800+", label: "Contractors" },
  { value: "₹500Cr+", label: "Projects Value" },
  { value: "4.9★", label: "Avg Rating" },
];

export default function ConstructionPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel — Contractor Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-[#0f1a0a] overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0f1a0a] via-[#1a2e10] to-[#0a1505]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,200,50,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,50,.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">BuildPro</p>
            <p className="text-orange-300 text-xs mt-0.5">Contractor Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Grow Your Business.
              <br />
              <span className="text-orange-400">Build More Projects.</span>
            </h1>
            <p className="mt-4 text-orange-100/70 text-base leading-relaxed max-w-md">
              Join India&apos;s most trusted contractor network. Find projects, manage your
              team, and get paid — all from one powerful platform.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-orange-50/80">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-orange-300 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">BuildPro</span>
            <span className="text-xs bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-full">
              Contractor
            </span>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6 px-4">
          © {new Date().getFullYear()} BuildPro · Contractor Portal ·{" "}
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
