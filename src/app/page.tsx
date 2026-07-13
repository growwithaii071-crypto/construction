import Link from "next/link";
import {
  HardHat,
  Building2,
  Users,
  ClipboardList,
  TrendingUp,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  FileText,
  Wrench,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { auth } from "@/auth";
import { Navbar } from "@/components/landing/navbar";

const STATS = [
  { value: "500+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "15+", label: "Years Experience" },
  { value: "1,200+", label: "Workers Managed" },
];

const SERVICES = [
  {
    icon: ClipboardList,
    title: "Project Management",
    description:
      "End-to-end project tracking with milestones, timelines, and real-time status updates for every phase of construction.",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: Users,
    title: "Team Coordination",
    description:
      "Manage contractors, engineers, and site workers with clear role assignments, schedules, and communication tools.",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: DollarSign,
    title: "Financial Control",
    description:
      "Automated invoicing, expense tracking, and payment management keep your budgets on track and transparent.",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Insightful dashboards and site reports give you a bird's-eye view of productivity, costs, and progress.",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: FileText,
    title: "Document Management",
    description:
      "Centralized storage for blueprints, contracts, permits, and compliance documents — always accessible.",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    icon: ShieldCheck,
    title: "Safety & Compliance",
    description:
      "Track safety issues, incidents, and regulatory requirements with built-in checklists and alerts.",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Sign Up",
    description: "Create your account as a customer looking to build, or as a contractor offering services.",
    icon: Users,
    bg: "bg-orange-500",
  },
  {
    step: "02",
    title: "Post or Find Projects",
    description: "Customers post their requirements. Contractors browse and bid on available projects.",
    icon: Building2,
    bg: "bg-blue-500",
  },
  {
    step: "03",
    title: "Track Progress",
    description: "Monitor every phase in real-time — from groundbreaking to final handover.",
    icon: TrendingUp,
    bg: "bg-green-500",
  },
  {
    step: "04",
    title: "Complete & Pay",
    description: "Automated invoicing, milestone-based payments, and final project sign-off.",
    icon: DollarSign,
    bg: "bg-purple-500",
  },
];

const TESTIMONIALS = [
  {
    name: "Rajesh Sharma",
    role: "Property Developer",
    company: "Sharma Developers Pvt Ltd",
    quote:
      "BuildPro transformed how we manage our residential projects. Real-time updates and automated invoicing saved us countless hours every week.",
    rating: 5,
    avatar: "RS",
    avatarBg: "bg-blue-600",
  },
  {
    name: "Priya Mehta",
    role: "Site Manager",
    company: "MetaConstruct Ltd",
    quote:
      "The contractor portal is intuitive and powerful. Managing our team of 200+ workers across 8 active sites has never been easier.",
    rating: 5,
    avatar: "PM",
    avatarBg: "bg-orange-500",
  },
  {
    name: "Arun Kapoor",
    role: "Architect & Client",
    company: "Kapoor Architecture",
    quote:
      "As a client, I finally have full visibility into my projects. No more chasing updates — everything is right there in the dashboard.",
    rating: 5,
    avatar: "AK",
    avatarBg: "bg-green-600",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ─── Hero ─── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden bg-linear-to-b from-orange-50 via-white to-white">
        {/* Decorative background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-100 rounded-full opacity-60 blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-orange-700 text-xs font-semibold tracking-wide uppercase">
              India&apos;s Leading Construction Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
            Build the Future.
            <br />
            <span className="text-orange-500">Manage the Present.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform connecting customers with trusted contractors — streamlining
            projects, teams, budgets, and progress tracking in one powerful dashboard.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/register"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-gray-900/15"
            >
              <Building2 className="w-5 h-5" />
              I&apos;m a Customer
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/construction/register"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-orange-500/25"
            >
              <HardHat className="w-5 h-5" />
              I&apos;m a Contractor
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            No credit card required &nbsp;·&nbsp; Free to get started &nbsp;·&nbsp; Set up in 2
            minutes
          </p>

          {/* Trust logos / icons row */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 opacity-40">
            {["ISO 9001", "RERA Compliant", "SSL Secured", "GDPR Ready", "24/7 Support"].map((badge) => (
              <span key={badge} className="text-xs font-semibold text-gray-500 border border-gray-300 rounded-full px-3 py-1">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-y border-gray-100 bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-orange-500">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Build Smarter
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base">
              From the first blueprint to the final handover — BuildPro covers every aspect of
              construction management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-orange-100 transition-all group"
                >
                  <div className={`w-11 h-11 ${service.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${service.iconColor}`} />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-base mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How BuildPro Works</h2>
            <p className="mt-4 text-gray-500 max-w-lg mx-auto text-base">
              Get started in minutes. No complicated setup — just sign up and start building.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] right-0 h-px bg-linear-to-r from-gray-300 to-transparent" />
                  )}
                  <div className={`relative inline-flex w-16 h-16 ${step.bg} rounded-2xl items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-100 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Two Portals ─── */}
      <section id="about" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Two Portals, One Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for Everyone on Site
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Card */}
            <div className="relative overflow-hidden bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/50 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-xl flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Portal</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Are you looking to build, renovate, or manage a construction project? Our
                  customer portal gives you full visibility, real-time updates, and direct
                  communication with your construction team.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Post your project requirements",
                    "Get matched with verified contractors",
                    "Track construction progress live",
                    "Review invoices & make payments",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/customer/register"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Sign Up as Customer
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Contractor Card */}
            <div className="relative overflow-hidden bg-linear-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/50 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center mb-5">
                  <HardHat className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contractor Portal</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Are you a construction company, contractor, or specialist? Grow your business
                  by connecting with clients, managing your projects, and streamlining your
                  entire operation.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Browse & bid on new projects",
                    "Manage your team and resources",
                    "Submit site reports & milestones",
                    "Automated invoicing & collections",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/construction/register"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Sign Up as Contractor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Trusted by Builders Across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className={`w-9 h-9 ${t.avatarBg} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-3xl p-10 sm:p-14 shadow-2xl shadow-orange-500/20">
            <Wrench className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-orange-100 text-base mb-8 max-w-lg mx-auto">
              Join thousands of customers and contractors who manage their construction projects
              more efficiently with BuildPro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/customer/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-7 py-3 rounded-xl text-sm hover:bg-orange-50 transition-all shadow-md"
              >
                <Building2 className="w-4 h-4" />
                Start as Customer
              </Link>
              <Link
                href="/construction/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-800 text-white font-bold px-7 py-3 rounded-xl text-sm transition-all"
              >
                <HardHat className="w-4 h-4" />
                Join as Contractor
              </Link>
            </div>
            <p className="mt-6 text-xs text-orange-200">
              Already have an account?{" "}
              <Link href="/login" className="text-white underline hover:no-underline transition-all">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <HardHat className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold">
                  Build<span className="text-orange-400">Pro</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 mb-4">
                India&apos;s leading construction management platform — connecting customers with
                trusted contractors since 2009.
              </p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-600" />
                  support@buildpro.in
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-600" />
                  +91 98765 43210
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-600" />
                  Mumbai, Maharashtra 400001
                </div>
              </div>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Portals</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Customer Login", href: "/customer/login" },
                  { label: "Customer Register", href: "/customer/register" },
                  { label: "Contractor Login", href: "/construction/login" },
                  { label: "Contractor Register", href: "/construction/register" },
                  { label: "Admin Panel", href: "/login" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
              <ul className="space-y-2.5">
                {[
                  "Project Management",
                  "Team Coordination",
                  "Financial Control",
                  "Site Reports",
                  "Safety & Compliance",
                ].map((s) => (
                  <li key={s}>
                    <span className="text-gray-500 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Business Hours</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>Monday – Friday</li>
                <li>9:00 AM – 6:00 PM IST</li>
                <li className="pt-1">Saturday</li>
                <li>9:00 AM – 2:00 PM IST</li>
                <li className="pt-1 text-gray-600">Sunday: Closed</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} BuildPro Technologies Pvt Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Mon–Sat, 9AM–6PM IST
              </span>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
