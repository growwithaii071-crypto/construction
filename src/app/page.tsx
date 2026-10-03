import Link from "next/link";
import Image from "next/image";
import {
  HardHat,
  ArrowRight,
  Shield,
  Star,
  MapPin,
  Zap,
  FileText,
  MessageSquare,
  CalendarCheck,
  BadgeCheck,
  Users,
  ClipboardList,
  Search,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";
import { auth } from "@/auth";
import { Navbar } from "@/components/landing/navbar";
import { HeroSearch } from "@/components/landing/hero-search";
import { PopularTradesSlider } from "@/components/landing/popular-trades-slider";

const HERO_FEATURES = [
  { icon: BadgeCheck, label: "Verified Tradespeople" },
  { icon: Star, label: "Real Reviews & Ratings" },
  { icon: MapPin, label: "Local & Reliable" },
  { icon: Zap, label: "Quick Quotes" },
];

const STEPS = [
  { n: 1, title: "Post or Search", desc: "Describe your job or browse traders", icon: FileText, color: "bg-blue-600" },
  { n: 2, title: "Get Quotes", desc: "Chat and compare offers", icon: MessageSquare, color: "bg-emerald-500" },
  { n: 3, title: "Choose & Hire", desc: "Pick the right pro", icon: CalendarCheck, color: "bg-violet-600" },
  { n: 4, title: "Get It Done", desc: "Track work to completion", icon: Shield, color: "bg-orange-500" },
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ── Hero ── */}
      <section className="relative bg-[#F3F6FA]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#dbeafe80_0%,transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16 lg:pr-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
            {/* Copy */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0B2A4A] shadow-sm">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                Trusted Tradespeople · Local to You
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-[#0B2A4A] sm:text-5xl lg:text-[3.35rem]">
                Find the right{" "}
                <span className="text-orange-500">tradie</span> for your next project.
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                Get multiple quotes, compare reviews and hire trusted tradespeople — all in one place.
              </p>

              <HeroSearch />

              {/* Mobile feature chips */}
              <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
                {HERO_FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <span
                      key={f.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-blue-600" />
                      {f.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Photo + overlapping feature badges */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
              <div className="relative aspect-4/5 overflow-hidden rounded-4xl bg-slate-200 shadow-2xl shadow-slate-300/40 sm:aspect-5/6 lg:ml-auto lg:aspect-auto lg:h-120 lg:w-full lg:max-w-[440px]">
                <Image
                  src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80"
                  alt="Electrician working on a job"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 440px"
                />
              </div>

              {/* Compact pills overlapping the photo’s right edge */}
              <div className="absolute top-1/2 right-2 z-20 hidden -translate-y-1/2 flex-col gap-2.5 xl:right-0 xl:translate-x-[18%] lg:flex">
                {HERO_FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-2.5 rounded-full border border-white/90 bg-white/95 py-2 pr-4 pl-2 shadow-[0_8px_24px_rgba(11,42,74,0.12)] backdrop-blur-sm"
                      style={{ marginLeft: i % 2 === 1 ? "0.75rem" : "0" }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F1FB] text-[#1D6FBF]">
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <span className="whitespace-nowrap text-[13px] font-bold tracking-tight text-[#0B2A4A]">
                        {f.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action cards — sit below hero, no overlap cut-off */}
          <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-3 lg:mt-12">
            {[
              {
                title: "Post a Job",
                desc: "Tell us what you need and get quotes from local trades.",
                href: "/customer/register",
                cta: "Post a Job",
                icon: ClipboardList,
                iconBg: "bg-blue-100 text-blue-700",
                btn: "bg-blue-600 hover:bg-blue-700 text-white",
              },
              {
                title: "Find a Trade",
                desc: "Search verified plumbers, electricians, builders and more.",
                href: "/services",
                cta: "Search Now",
                icon: Search,
                iconBg: "bg-emerald-100 text-emerald-700",
                btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
              },
              {
                title: "My Jobs",
                desc: "Track requests, messages and progress in one place.",
                href: isLoggedIn ? "/customer/requests" : "/login?callbackUrl=/customer/requests",
                cta: "View My Jobs",
                icon: Briefcase,
                iconBg: "bg-violet-100 text-violet-700",
                btn: "bg-violet-600 hover:bg-violet-700 text-white",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 transition-transform hover:-translate-y-0.5"
                >
                  <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B2A4A]">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  <Link
                    href={card.href}
                    className={`mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-colors ${card.btn}`}
                  >
                    {card.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular Trades ── */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-[#0B2A4A] sm:text-3xl">Popular Trades</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 sm:text-base">
              From small jobs to big projects, find the right expert for your needs.
            </p>
          </div>

          <PopularTradesSlider />
        </div>
      </section>

      {/* ── Why Choose + How It Works ── */}
      <section id="how-it-works" className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-slate-100 shadow-xl lg:grid-cols-2">
          {/* Why Choose */}
          <div id="about" className="relative min-h-[320px] bg-[#0B2A4A] p-8 text-white sm:p-10 lg:min-h-[420px]">
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
                alt="Happy customer using BuildPro"
                fill
                className="object-cover opacity-35"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0B2A4A] via-[#0B2A4A]/85 to-[#0B2A4A]/55" />
            </div>
            <div className="relative flex h-full max-w-md flex-col justify-end">
              <p className="text-sm font-semibold text-orange-400">Why Choose BuildPro?</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                Simple. Safe.{" "}
                <span className="text-orange-400">Stress-Free.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
                Transparent pricing, verified professionals, and secure messaging — so you can hire with confidence and get the job done right.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-extrabold text-[#0B2A4A] sm:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-slate-500">Four simple steps from search to done.</p>

            <div className="mt-8 grid grid-cols-2 gap-6 sm:gap-8">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative">
                    {i < STEPS.length - 1 && i % 2 === 0 && (
                      <div className="absolute left-[calc(100%+0.25rem)] top-5 hidden h-px w-6 border-t border-dashed border-slate-200 sm:block" />
                    )}
                    <div className="flex flex-col items-start gap-3">
                      <div className="relative">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${step.color} text-white shadow-md`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2A4A] text-[10px] font-bold text-white">
                          {step.n}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0B2A4A]">{step.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/services"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B2A4A] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#163A5F]"
            >
              Find a trader
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA bar ── */}
      <section className="bg-[#0B2A4A] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange-400 sm:flex">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-base font-semibold text-white sm:text-lg">
              Join thousands of happy customers and skilled tradespeople.
            </p>
          </div>
          <Link
            href="/customer/register"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-orange-500 px-7 text-sm font-bold text-white shadow-lg shadow-orange-900/30 transition-colors hover:bg-orange-600"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-[#071A30] px-4 pb-8 pt-14 text-white/45 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                  <HardHat className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Build<span className="text-orange-400">Pro</span>
                </span>
              </div>
              <p className="mb-5 text-sm leading-relaxed">
                Find, hire and manage trusted tradespeople for every home and construction job.
              </p>
              <div className="space-y-2 text-sm">
                <a href="mailto:support@buildpro.in" className="flex items-center gap-2 hover:text-white/80">
                  <Mail className="h-3.5 w-3.5" /> support@buildpro.in
                </a>
                <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-white/80">
                  <Phone className="h-3.5 w-3.5" /> +91 98765 43210
                </a>
              </div>
            </div>

            {[
              {
                title: "Customers",
                links: [
                  { label: "Find a Trader", href: "/services" },
                  { label: "Post a Job", href: "/customer/register" },
                  { label: "How It Works", href: "/#how-it-works" },
                  { label: "Sign In", href: "/login" },
                ],
              },
              {
                title: "Tradespeople",
                links: [
                  { label: "Find Work", href: "/construction/register" },
                  { label: "Register", href: "/construction/register" },
                  { label: "Sign In", href: "/login" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us", href: "/#about" },
                  { label: "Contact", href: "/#contact" },
                  { label: "Admin", href: "/login" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold text-white">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm transition-colors hover:text-white/80">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row">
            <p>© {new Date().getFullYear()} BuildPro. All rights reserved.</p>
            <div className="flex gap-5">
              {["Privacy Policy", "Terms of Service"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
