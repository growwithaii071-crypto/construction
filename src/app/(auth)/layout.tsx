import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Home, BadgeCheck, Star, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — BuildPro",
  description: "Sign in as Admin, Client, or Contractor on BuildPro",
};

const HIGHLIGHTS = [
  { icon: BadgeCheck, text: "Verified tradespeople" },
  { icon: Star, text: "Real reviews & ratings" },
  { icon: Shield, text: "Secure messaging" },
  { icon: Zap, text: "Quick quotes" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#0B2A4A] lg:flex lg:flex-col">
        <Image
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80"
          alt="Construction tradespeople at work"
          fill
          priority
          className="object-cover opacity-35"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#071A30] via-[#0B2A4A]/85 to-[#0B2A4A]/60" />

        <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-900/30">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Build<span className="text-orange-400">Pro</span>
            </span>
          </Link>

          <div className="my-auto max-w-md py-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-400">
              Welcome back
            </p>
            <h2 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
              Find. Hire.{" "}
              <span className="text-orange-400">Get it done.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Sign in to message traders, manage jobs, and grow your construction business — all in one place.
            </p>

            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.text}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-white">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} BuildPro · Trusted by customers & contractors
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <div className="relative flex flex-col bg-[#F3F6FA]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#fdba7425_0%,transparent_45%),radial-gradient(ellipse_at_bottom_left,#93c5fd30_0%,transparent_50%)]" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2A4A]">
              <Home className="h-4 w-4 text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#F3F6FA]" />
            </div>
            <span className="text-lg font-extrabold text-[#0B2A4A]">
              Build<span className="text-orange-500">Pro</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#0B2A4A]"
          >
            ← Back to home
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="rounded-3xl border border-white bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
