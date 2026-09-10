import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Sign In — BuildPro",
  description: "Sign in as Admin, Client, or Contractor on BuildPro",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
        {/* Atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(249,115,22,0.08),_transparent_50%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
            {children}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
