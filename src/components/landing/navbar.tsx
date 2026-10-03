"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  isLoggedIn: boolean;
}

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Find a Trader" },
  { href: "/customer/register", label: "Post a Job" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#about", label: "About Us" },
];

export function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2A4A] shadow-sm">
            <Home className="h-4 w-4 text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#0B2A4A]">
            Build<span className="text-orange-500">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-semibold transition-colors",
                i === 0
                  ? "text-[#0B2A4A] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-orange-500"
                  : "text-slate-600 hover:text-[#0B2A4A]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-[#0B2A4A] transition-colors hover:text-orange-600"
              >
                Log In
              </Link>
              <Link
                href="/customer/register"
                className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-orange-500 py-2.5 text-center text-sm font-bold text-white"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="py-2 text-center text-sm font-semibold text-[#0B2A4A]">
                  Log In
                </Link>
                <Link
                  href="/customer/register"
                  className="rounded-full bg-orange-500 py-2.5 text-center text-sm font-bold text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
