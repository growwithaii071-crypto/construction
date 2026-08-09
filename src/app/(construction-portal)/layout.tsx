import type { Metadata } from "next";
import Link from "next/link";
import { HardHat, Building2, Phone, Mail, MapPin, Star, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Contractor Portal — BuildPro",
  description: "Sign in or register your construction company on BuildPro",
};

export default function ConstructionPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c1005]">

      {/* ── HEADER ── */}
      <header className="relative z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">
              Build<span className="text-orange-400">Pro</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-white/50 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              ← Home
            </Link>
            <Link
              href="/customer/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 border border-blue-400/30 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-2 rounded-lg transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Customer Portal
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 relative flex items-center justify-center px-4 py-12 overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0c1005] via-[#1a2e10]/60 to-[#0c1005]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

            {/* Left — Trust / info */}
            <div className="hidden lg:block text-white pr-8">
              <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1.5 mb-6">
                <HardHat className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-300 text-xs font-semibold">Contractor Portal</span>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                Grow your business.
                <span className="block text-orange-400">Get more projects.</span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed mb-10">
                Join 800+ contractors on BuildPro. Get quality leads, manage your team, and get paid on time.
              </p>

              {/* Trust stats */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { val: "800+", label: "Contractors" },
                  { val: "₹500Cr+", label: "Projects" },
                  { val: "4.9★", label: "Avg Rating" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xl font-extrabold text-white">{s.val}</p>
                    <p className="text-xs text-white/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">
                  &ldquo;BuildPro gave us a steady stream of quality projects. Our revenue doubled in 6 months. The platform is incredibly easy to use.&rdquo;
                </p>
                <div className="flex items-center gap-2.5 mt-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">VK</div>
                  <div>
                    <p className="text-white text-sm font-semibold">Vijay Kumar</p>
                    <p className="text-white/40 text-xs">Contractor, Pune · 12 yrs experience</p>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { icon: ShieldCheck, label: "Verified Leads" },
                  { icon: Zap, label: "Instant Notifications" },
                ].map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                      <Icon className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-white/60 font-medium">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — Form card */}
            <div className="w-full">
              <div className="bg-white rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Card top accent */}
                <div className="h-1.5 bg-linear-to-r from-orange-400 via-orange-500 to-amber-500" />
                <div className="p-8 sm:p-10">
                  {children}
                </div>
              </div>

              {/* Below card links */}
              <div className="flex items-center justify-center gap-4 mt-5 text-sm text-white/40">
                <Link href="/customer/login" className="hover:text-white/70 transition-colors">
                  Customer Login
                </Link>
                <span>·</span>
                <Link href="/" className="hover:text-white/70 transition-colors">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative border-t border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                  <HardHat className="w-3 h-3 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Build<span className="text-orange-400">Pro</span></span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                India&apos;s most trusted contractor network. Find projects, build your reputation, get paid.
              </p>
            </div>
            <div>
              <h4 className="text-white/60 font-semibold text-xs uppercase tracking-widest mb-3">Quick Links</h4>
              <div className="space-y-1.5">
                {[
                  { label: "Home", href: "/" },
                  { label: "Find Work", href: "/construction/register" },
                  { label: "Customer Login", href: "/customer/login" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white/60 font-semibold text-xs uppercase tracking-widest mb-3">Support</h4>
              <div className="space-y-1.5 text-xs text-white/30">
                <a href="mailto:support@buildpro.in" className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
                  <Mail className="w-3 h-3" /> support@buildpro.in
                </a>
                <a href="tel:+919876543210" className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
                  <Phone className="w-3 h-3" /> +91 98765 43210
                </a>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Mumbai, Maharashtra
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
            <p>© {new Date().getFullYear()} BuildPro Technologies Pvt Ltd. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white/40 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white/40 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
