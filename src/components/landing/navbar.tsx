"use client";

import { useState } from "react";
import Link from "next/link";
import { HardHat, Menu, X, ChevronRight } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#about", label: "About" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:bg-orange-400 transition-colors">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">
              Build<span className="text-orange-500">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/customer/login"
                  className="text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
                >
                  Customer Login
                </Link>
                <Link
                  href="/construction/login"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Contractor Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-gray-600 hover:text-gray-900 text-sm font-medium py-1.5"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-center bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/customer/login"
                  className="text-center border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Customer Login
                </Link>
                <Link
                  href="/construction/login"
                  className="text-center bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                >
                  Contractor Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
