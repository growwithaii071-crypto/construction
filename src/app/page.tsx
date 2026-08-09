import Link from "next/link";
import {
  HardHat,
  Building2,
  Users,
  CheckCircle2,
  Star,
  ArrowRight,
  Wrench,
  Zap,
  Shield,
  Clock,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Hammer,
  Layers,
  Lightbulb,
  Droplets,
  Home,
  TreePine,
  PaintBucket,
  Ruler,
  Smartphone,
  ChevronRight,
  BadgeCheck,
  ThumbsUp,
} from "lucide-react";
import { auth } from "@/auth";
import { Navbar } from "@/components/landing/navbar";

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ══════════════════════════════════════════
          HERO  — dark bg, text left, image right
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-[#1a0533] flex flex-col">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-150 h-150 bg-violet-800/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-100 h-100 bg-violet-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-0 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-end min-h-[80vh]">

            {/* ── Left: Copy ── */}
            <div className="pb-16 lg:pb-24 pt-8">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-extrabold text-white leading-[1.15] tracking-tight max-w-110">
                The reliable way to hire a contractor
              </h1>

              <p className="mt-5 text-white/50 text-base max-w-sm leading-relaxed">
                Connect with verified professionals for any construction or home improvement job.
              </p>

              {/* Search input */}
              <div className="mt-8 max-w-105">
                <label className="block text-white/70 text-sm font-medium mb-2">What&apos;s your job?</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. House construction, plumber..."
                      className="w-full h-12 pl-10 pr-4 bg-white rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <Link
                    href="/customer/register"
                    className="h-12 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-lg shadow-violet-700/30"
                  >
                    Get quotes
                  </Link>
                </div>
                <p className="mt-2.5 text-xs text-white/30">Free to post · No obligation · Replies in hours</p>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-8">
                {[
                  { val: "2,400+", label: "contractors on site" },
                  { val: "104", label: "active trades" },
                  { val: "15,200+", label: "jobs completed" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-extrabold text-white leading-none">{s.val}</p>
                    <p className="text-xs text-white/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Photo mockup ── */}
            <div className="hidden lg:flex items-end justify-center lg:justify-end pb-0">
              {/* Outer frame — simulates a tradesperson photo */}
              <div className="relative w-90 h-110">
                {/* Background gradient "photo" */}
                <div className="absolute inset-0 rounded-t-3xl overflow-hidden bg-linear-to-b from-amber-800 to-amber-950">
                  {/* Silhouette of person working */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-80">
                    <svg viewBox="0 0 160 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-60">
                      <ellipse cx="80" cy="40" rx="28" ry="30" fill="#fbbf24" opacity="0.8" />
                      <path d="M40 100 Q30 80 52 68 Q80 55 108 68 Q130 80 120 100 L125 200 L35 200 Z" fill="#92400e" opacity="0.9" />
                      <rect x="35" y="195" width="35" height="120" rx="8" fill="#78350f" opacity="0.9" />
                      <rect x="90" y="195" width="35" height="120" rx="8" fill="#78350f" opacity="0.9" />
                      <path d="M120 100 L150 140 L140 155 L110 115 Z" fill="#b45309" opacity="0.8" />
                      <path d="M40 100 L10 140 L20 155 L50 115 Z" fill="#b45309" opacity="0.8" />
                      {/* Hard hat */}
                      <ellipse cx="80" cy="14" rx="34" ry="12" fill="#f59e0b" />
                      <ellipse cx="80" cy="10" rx="28" ry="10" fill="#fbbf24" />
                    </svg>
                  </div>
                  {/* Green overlay tint at top */}
                  <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-violet-900/60 to-transparent" />
                </div>

                {/* Floating quote card */}
                <div className="absolute -left-12 bottom-24 bg-white rounded-2xl shadow-2xl p-4 w-48 border border-gray-100">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-xs font-bold text-gray-900">3 quotes received!</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sharma Builders · ₹4.2L</p>
                </div>

                {/* Floating verified badge */}
                <div className="absolute -right-8 top-12 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 w-40 border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Verified</p>
                    <p className="text-xs text-gray-400">2,400 pros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* White wave bottom */}
        <div className="relative h-12 bg-[#1a0533]">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" fill="white">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW TO HIRE — white bg, 3 steps
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-14">
            How to hire the right contractor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px border-t-2 border-dashed border-gray-200" />

            {[
              {
                icon: MessageSquare,
                bg: "bg-violet-100",
                iconColor: "text-violet-600",
                title: "Post a job for free",
                desc: "Tell us what you need — from house construction to a quick repair. Takes 2 minutes.",
              },
              {
                icon: Users,
                bg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                title: "Receive & compare quotes",
                desc: "Interested contractors respond. Browse profiles, past work, and customer reviews.",
              },
              {
                icon: Shield,
                bg: "bg-amber-100",
                iconColor: "text-amber-600",
                title: "Hire with confidence",
                desc: "Choose the best fit, track progress in real-time, and pay safely when done.",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col items-center text-center gap-4">
                  <div className={`relative w-20 h-20 ${step.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-8 h-8 ${step.iconColor}`} />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1.5">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/customer/register"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-colors shadow-md shadow-violet-600/25"
            >
              Get a quote
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY BUILDPRO — WHITE bg, text left, image right
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <p className="text-violet-600 text-sm font-semibold mb-3">Why BuildPro</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 leading-tight">
                BuildPro is the reliable way to build
              </h2>

              <ul className="space-y-5">
                {[
                  {
                    title: "Get verified and vetted professionals",
                    desc: "Every contractor on BuildPro is background-checked, verified and rated by real customers.",
                  },
                  {
                    title: "Choose only from contractors who want your job",
                    desc: "Only interested, available professionals respond — saving you time and hassle.",
                  },
                  {
                    title: "Hire with real reviews and vetted profiles",
                    desc: "Read genuine customer reviews, see past work photos, and compare verified credentials.",
                  },
                ].map((point) => (
                  <li key={point.title} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{point.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{point.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href="/customer/register"
                className="mt-10 inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:text-violet-700 group"
              >
                Learn more about how it works
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right: photo collage mockup */}
            <div className="relative h-100 rounded-3xl overflow-hidden">
              {/* Main "photo" background */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-700 via-orange-800 to-amber-950 rounded-3xl">
                {/* Person illustration */}
                <div className="absolute inset-0 flex items-end justify-center pb-0 opacity-50">
                  <svg viewBox="0 0 200 300" fill="none" className="w-48 h-72">
                    <ellipse cx="100" cy="50" rx="32" ry="34" fill="#fbbf24" />
                    <path d="M55 130 Q45 105 70 88 Q100 72 130 88 Q155 105 145 130 L150 240 L50 240 Z" fill="#92400e" />
                    <rect x="50" y="235" width="40" height="60" rx="8" fill="#78350f" />
                    <rect x="110" y="235" width="40" height="60" rx="8" fill="#78350f" />
                    <path d="M145 130 L178 172 L165 184 L132 142 Z" fill="#b45309" />
                    <path d="M55 130 L22 172 L35 184 L68 142 Z" fill="#b45309" />
                    <ellipse cx="100" cy="20" rx="38" ry="14" fill="#f59e0b" />
                    <ellipse cx="100" cy="15" rx="32" ry="12" fill="#fcd34d" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-amber-950/80 to-transparent" />
              </div>

              {/* Floating card 1 — rating */}
              <div className="absolute top-6 left-6 bg-white rounded-2xl shadow-xl p-4 w-44">
                <div className="flex gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-xs font-bold text-gray-900">Excellent work!</p>
                <p className="text-xs text-gray-400 mt-0.5">— Priya M., Mumbai</p>
              </div>

              {/* Floating card 2 — job done */}
              <div className="absolute bottom-8 right-6 bg-white rounded-2xl shadow-xl p-4 w-48">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Job Complete</p>
                    <p className="text-xs text-emerald-500 font-medium">Paid ₹3,40,000</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          READY TO HIRE — light gray, CTA + trade cards
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Ready to hire with confidence?
          </h2>
          <Link
            href="/customer/register"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3.5 rounded-full text-sm transition-colors shadow-md shadow-violet-600/25 mb-14"
          >
            Post a job — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">Browse by trade</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { icon: Home, label: "House Build", color: "bg-violet-50 text-violet-600 border-violet-100" },
              { icon: Lightbulb, label: "Electrical", color: "bg-amber-50 text-amber-600 border-amber-100" },
              { icon: Droplets, label: "Plumbing", color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
              { icon: PaintBucket, label: "Painting", color: "bg-pink-50 text-pink-600 border-pink-100" },
              { icon: Layers, label: "Flooring", color: "bg-orange-50 text-orange-600 border-orange-100" },
              { icon: Hammer, label: "Renovation", color: "bg-red-50 text-red-600 border-red-100" },
              { icon: Building2, label: "Commercial", color: "bg-blue-50 text-blue-600 border-blue-100" },
              { icon: Ruler, label: "Structural", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
              { icon: TreePine, label: "Landscaping", color: "bg-green-50 text-green-600 border-green-100" },
              { icon: Wrench, label: "Maintenance", color: "bg-gray-100 text-gray-600 border-gray-200" },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href="/customer/register"
                  className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl border ${cat.color} hover:shadow-md hover:-translate-y-0.5 transition-all text-center`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR TRADES — photo cards in row
      ══════════════════════════════════════════ */}
      <section id="services" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">
            Popular trades
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              {
                title: "Full House Construction",
                jobs: "4,200+ jobs",
                gradient: "from-amber-700 via-orange-800 to-amber-900",
                icon: Home,
              },
              {
                title: "Interior Finishing",
                jobs: "2,800+ jobs",
                gradient: "from-blue-700 via-indigo-800 to-blue-900",
                icon: PaintBucket,
              },
              {
                title: "Electrical Works",
                jobs: "3,500+ jobs",
                gradient: "from-amber-500 via-yellow-600 to-orange-700",
                icon: Lightbulb,
              },
            ].map((trade) => {
              const Icon = trade.icon;
              return (
                <div key={trade.title} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer">
                  {/* Photo bg */}
                  <div className={`h-44 bg-linear-to-br ${trade.gradient} flex items-end p-5 relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-15">
                      <Icon className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative">
                      <p className="text-white/60 text-xs mb-1">{trade.jobs}</p>
                      <h3 className="text-white font-bold text-lg leading-tight">{trade.title}</h3>
                    </div>
                  </div>
                  {/* Card footer */}
                  <div className="bg-white px-5 py-4 flex items-center justify-between border border-t-0 border-gray-100 rounded-b-2xl">
                    <span className="text-sm text-gray-500">See all contractors</span>
                    <Link
                      href="/customer/register"
                      className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
                    >
                      Hire
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/customer/register" className="inline-flex items-center gap-1.5 text-violet-600 font-semibold text-sm hover:text-violet-700">
              View all 104 trades <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LOOKING FOR LEADS — dark bg, photo left, text right
      ══════════════════════════════════════════ */}
      <section id="about" className="py-20 px-4 sm:px-6 bg-[#0d2418]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: photo mockup */}
            <div className="relative h-95 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-800 to-teal-950">
                {/* Contractor silhouette */}
                <div className="absolute bottom-0 inset-x-0 flex justify-center opacity-40">
                  <svg viewBox="0 0 200 320" fill="none" className="w-56 h-80">
                    <ellipse cx="100" cy="45" rx="30" ry="32" fill="#6ee7b7" />
                    <path d="M55 120 Q45 98 68 84 Q100 70 132 84 Q155 98 145 120 L150 230 L50 230 Z" fill="#059669" />
                    <rect x="52" y="226" width="38" height="90" rx="8" fill="#047857" />
                    <rect x="110" y="226" width="38" height="90" rx="8" fill="#047857" />
                    <path d="M145 120 L175 160 L163 172 L133 132 Z" fill="#10b981" />
                    <path d="M55 120 L25 160 L37 172 L67 132 Z" fill="#10b981" />
                    <ellipse cx="100" cy="16" rx="36" ry="13" fill="#f59e0b" />
                    <ellipse cx="100" cy="12" rx="30" ry="11" fill="#fcd34d" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-emerald-950/70 to-transparent" />
              </div>

              {/* Rating card */}
              <div className="absolute top-6 right-6 bg-white rounded-2xl shadow-xl p-4 w-44">
                <p className="text-xs text-gray-500 mb-1">Your profile</p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm font-bold text-gray-900">4.9 / 5</p>
                <p className="text-xs text-gray-400">127 reviews</p>
              </div>

              {/* New lead card */}
              <div className="absolute bottom-8 left-6 bg-white rounded-2xl shadow-xl p-4 w-48">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">New lead!</p>
                    <p className="text-xs text-gray-400">House renovation · Delhi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: text */}
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">For Contractors</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Looking for leads?<br />Stand out on BuildPro
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                Join thousands of construction professionals who grow their business on BuildPro. Get matched to the right jobs, build your reputation with verified reviews, and get paid on time.
              </p>

              <ul className="space-y-3 mb-10">
                {[
                  "Create a free contractor profile in minutes",
                  "Get leads from customers in your area",
                  "Build a verified portfolio of completed work",
                  "Grow with real customer reviews and ratings",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/construction/register"
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3.5 rounded-full text-sm transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <HardHat className="w-4 h-4" />
                  Register as contractor
                </Link>
                <Link
                  href="/construction/login"
                  className="flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-white/10 transition-colors"
                >
                  Already a member? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DOWNLOAD APP — white bg, phone mockup right
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">Mobile App</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5">
                Manage your jobs on the go
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Track your construction projects, chat with contractors, review quotes, and approve milestones — all from your phone.
              </p>

              <ul className="space-y-3 mb-10">
                {[
                  "Real-time project progress tracking",
                  "Instant quote notifications",
                  "Secure in-app messaging",
                  "Safe milestone-based payments",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
                  <Smartphone className="w-5 h-5" />
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none">Download on the</p>
                    <p className="text-sm font-bold leading-none mt-0.5">App Store</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
                  <Zap className="w-5 h-5" />
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none">Get it on</p>
                    <p className="text-sm font-bold leading-none mt-0.5">Google Play</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-60 h-125 bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl relative">
                  <div className="w-full h-full bg-white rounded-4xl overflow-hidden relative">
                    {/* Status bar */}
                    <div className="bg-violet-600 h-14 flex items-center px-4">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mr-2">
                        <HardHat className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">BuildPro</span>
                    </div>
                    {/* App content */}
                    <div className="p-4 space-y-3">
                      <p className="text-gray-500 text-xs font-semibold uppercase">Active Projects</p>
                      {[
                        { name: "Villa Build", prog: 72, color: "bg-violet-500" },
                        { name: "Office Reno", prog: 45, color: "bg-emerald-500" },
                        { name: "Electrical", prog: 90, color: "bg-amber-500" },
                      ].map((p) => (
                        <div key={p.name} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-800">{p.name}</span>
                            <span className="text-xs text-gray-400">{p.prog}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.prog}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2">
                        <p className="text-gray-500 text-xs font-semibold uppercase mb-2">New Quotes</p>
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-900">Sharma Builders</p>
                          <div className="flex gap-0.5 my-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />)}
                          </div>
                          <p className="text-xs text-violet-600 font-semibold">₹4,20,000 — View →</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full" />
                </div>
                {/* Glow under phone */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-violet-400/20 blur-2xl rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS — big photo bg
      ══════════════════════════════════════════ */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background: simulate an outdoor job site photo */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-800 to-slate-900">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "linear-gradient(45deg, #ffffff10 25%, transparent 25%), linear-gradient(-45deg, #ffffff10 25%, transparent 25%)", backgroundSize: "60px 60px" }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">What our customers say</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Trusted by builders across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Rajesh Sharma", role: "Property Developer · Mumbai", avatar: "RS", bg: "bg-violet-600",
                quote: "BuildPro made finding trusted contractors so easy. Got 5 quotes in 24 hours — hired within a week. Project finished on time and on budget!",
              },
              {
                name: "Priya Mehta", role: "Homeowner · Bangalore", avatar: "PM", bg: "bg-emerald-600",
                quote: "I was nervous about home renovation but BuildPro's verified contractors gave me complete peace of mind. Real-time tracking is a game changer.",
              },
              {
                name: "Arun Kapoor", role: "Business Owner · Delhi", avatar: "AK", bg: "bg-blue-600",
                quote: "Used BuildPro for our commercial fit-out. The quoting system saved weeks of back-and-forth. Will definitely use again for our next project.",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className={`w-10 h-10 ${t.bg} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            {[
              { val: "4.9/5", label: "Average rating", icon: Star },
              { val: "98%", label: "Would recommend", icon: ThumbsUp },
              { val: "15,200+", label: "Jobs completed", icon: CheckCircle2 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-violet-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{stat.val}</p>
                    <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POST YOUR JOB CTA — purple banner
      ══════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-linear-to-r from-violet-600 via-violet-600 to-indigo-600 rounded-3xl px-8 sm:px-14 py-12 text-center shadow-2xl shadow-violet-600/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,#ffffff15_0%,transparent_60%)]" />
            <div className="relative">
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-3">Get started today</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Post your job today
              </h2>
              <p className="text-white/60 text-base mb-8 max-w-lg mx-auto">
                Free to post. Get quotes from verified local contractors within 24 hours. No commitment required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/customer/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-violet-700 font-bold px-8 py-3.5 rounded-full text-sm hover:bg-violet-50 transition-colors shadow-lg"
                >
                  <Building2 className="w-4 h-4" />
                  I need a contractor
                </Link>
                <Link
                  href="/construction/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-colors"
                >
                  <HardHat className="w-4 h-4" />
                  I&apos;m a contractor
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/40">
                Already have an account?{" "}
                <Link href="/customer/login" className="text-white/70 underline hover:text-white transition-colors">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — dark purple/navy
      ══════════════════════════════════════════ */}
      <footer className="bg-[#0a0818] text-white/40 pt-16 pb-8 px-4 sm:px-6" id="contact">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <HardHat className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Build<span className="text-violet-400">Pro</span></span>
              </div>
              <p className="text-sm leading-relaxed text-white/40 mb-5">
                India&apos;s leading platform connecting customers with trusted construction professionals.
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { icon: Mail, text: "support@buildpro.in", href: "mailto:support@buildpro.in" },
                  { icon: Phone, text: "+91 98765 43210", href: "tel:+919876543210" },
                  { icon: MapPin, text: "Mumbai, Maharashtra 400001", href: "#" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.text} href={item.href} className="flex items-center gap-2 hover:text-white/70 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-white/25 shrink-0" />
                      {item.text}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Customers */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Customers</h4>
              <ul className="space-y-3">
                {[
                  { label: "Post a Job", href: "/customer/register" },
                  { label: "How it Works", href: "#how-it-works" },
                  { label: "Browse Services", href: "/customer/services" },
                  { label: "Customer Login", href: "/customer/login" },
                  { label: "Create Account", href: "/customer/register" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contractors */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Contractors</h4>
              <ul className="space-y-3">
                {[
                  { label: "Find Work", href: "/construction/register" },
                  { label: "Contractor Login", href: "/construction/login" },
                  { label: "Register Company", href: "/construction/register" },
                  { label: "Add Services", href: "/construction/services" },
                  { label: "View Requests", href: "/construction/requests" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" },
                  { label: "Admin Portal", href: "/login" },
                  { label: "Contact", href: "#contact" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <p>© {new Date().getFullYear()} BuildPro Technologies Pvt Ltd. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <span key={l} className="hover:text-white/50 cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
