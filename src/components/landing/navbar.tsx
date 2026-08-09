"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HardHat, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className={cn("font-bold text-lg tracking-tight transition-colors", scrolled ? "text-gray-900" : "text-white")}>
              Build<span className="text-violet-400">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#services", label: "Services" },
              { href: "#about", label: "About" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg transition-colors",
                  scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/customer/login"
                  className={cn(
                    "text-sm font-medium px-4 py-2 rounded-full transition-colors",
                    scrolled ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/customer/register"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors shadow-sm"
                >
                  Post a job
                </Link>
                <Link
                  href="/construction/register"
                  className={cn(
                    "text-sm font-medium px-4 py-2 rounded-full border transition-colors",
                    scrolled
                      ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                      : "border-white/30 text-white hover:bg-white/10"
                  )}
                >
                  Find work
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={cn("md:hidden p-2 rounded-lg transition-colors", scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10")}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-5 space-y-2 shadow-xl">
          {[
            { href: "#how-it-works", label: "How it works" },
            { href: "#services", label: "Services" },
            { href: "#about", label: "About" },
          ].map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2 text-sm">
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="block text-center bg-violet-600 text-white font-semibold py-2.5 rounded-full text-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/customer/register" className="block text-center bg-violet-600 text-white font-semibold py-2.5 rounded-full text-sm">
                  Post a job
                </Link>
                <Link href="/construction/register" className="block text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-full text-sm">
                  Find work
                </Link>
                <Link href="/customer/login" className="block text-center text-violet-600 font-medium py-2 text-sm">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
