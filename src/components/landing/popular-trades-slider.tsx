"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Bolt,
  Paintbrush,
  Hammer,
  Home,
  Leaf,
  Flame,
  Building2,
  Wrench,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TRADES: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Plumbing", icon: Droplets, href: "/services?search=plumber" },
  { label: "Electrician", icon: Bolt, href: "/services?search=electrician" },
  { label: "Painting & Decorating", icon: Paintbrush, href: "/services?search=painting" },
  { label: "Carpentry", icon: Hammer, href: "/services?search=carpentry" },
  { label: "Roofing", icon: Home, href: "/services?search=roofing" },
  { label: "Gardening", icon: Leaf, href: "/services?search=gardening" },
  { label: "Heating & Gas", icon: Flame, href: "/services?search=heating" },
  { label: "Building", icon: Building2, href: "/services?search=building" },
  { label: "Handyman", icon: Wrench, href: "/services?search=handyman" },
  { label: "Tiling", icon: Ruler, href: "/services?search=tiling" },
];

export function PopularTradesSlider() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [paused, setPaused] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }

  function scrollByCard(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-trade-card]");
    const step = (card?.offsetWidth ?? 160) + 16;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  // Gentle auto-slide
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, 3500);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        aria-label="Previous trades"
        disabled={!canPrev}
        onClick={() => scrollByCard(-1)}
        className={cn(
          "absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0B2A4A] shadow-md transition-all sm:flex",
          canPrev ? "hover:bg-blue-50 hover:border-blue-200" : "cursor-not-allowed opacity-40"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Next trades"
        disabled={!canNext}
        onClick={() => scrollByCard(1)}
        className={cn(
          "absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0B2A4A] shadow-md transition-all sm:flex",
          canNext ? "hover:bg-blue-50 hover:border-blue-200" : "cursor-not-allowed opacity-40"
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2 sm:px-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {TRADES.map((trade) => {
          const Icon = trade.icon;
          return (
            <Link
              key={trade.label}
              href={trade.href}
              data-trade-card
              className="flex w-36 shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:w-40"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <span className="text-center text-xs font-bold leading-snug text-[#0B2A4A] sm:text-sm">
                {trade.label}
              </span>
            </Link>
          );
        })}

        <Link
          href="/services"
          data-trade-card
          className="flex w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-3 py-5 text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-50 sm:w-40"
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <ArrowRight className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold sm:text-sm">View All</span>
        </Link>
      </div>

      {/* Mobile hint dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5 sm:hidden">
        <span className="text-xs text-slate-400">Swipe to explore</span>
      </div>
    </div>
  );
}
