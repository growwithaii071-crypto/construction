import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Portal — BuildPro",
  description: "Sign in or create a customer account on BuildPro",
};

const FEATURES = [
  "Post project requirements in minutes",
  "Get matched with verified contractors",
  "Track construction progress in real-time",
  "Review invoices & approve payments",
  "Direct messaging with your team",
  "All project documents in one place",
];

const STATS = [
  { value: "2,400+", label: "Happy Clients" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24/7", label: "Support" },
];

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel — Customer Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-[#0d2137] overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0d2137] via-[#0f3057] to-[#071a2f]" />

        {/* Decorative dots grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">BuildPro</p>
            <p className="text-blue-300 text-xs mt-0.5">Customer Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Build Your Vision
              <br />
              <span className="text-blue-400">With Confidence.</span>
            </h1>
            <p className="mt-4 text-blue-200 text-base leading-relaxed max-w-md">
              Connect with India&apos;s best construction teams. Track every detail of your
              project — from blueprint to handover.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
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
              <p className="text-blue-300 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">BuildPro</span>
            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
              Customer
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
          © {new Date().getFullYear()} BuildPro · Customer Portal ·{" "}
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
