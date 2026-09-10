import Link from "next/link";
import { HardHat, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-[#0a0818] px-4 pb-8 pt-14 text-white/40 sm:px-6" id="contact">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <HardHat className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Build<span className="text-violet-400">Pro</span>
              </span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-white/40">
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
                  <a
                    key={item.text}
                    href={item.href}
                    className="flex items-center gap-2 transition-colors hover:text-white/70"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-white/25" />
                    {item.text}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">Customers</h4>
            <ul className="space-y-3">
              {[
                { label: "Post a Job", href: "/customer/register" },
                { label: "Browse Services", href: "/services" },
                { label: "Sign In", href: "/login" },
                { label: "Create Account", href: "/customer/register" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/40 transition-colors hover:text-white/80">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">Contractors</h4>
            <ul className="space-y-3">
              {[
                { label: "Find Work", href: "/construction/register" },
                { label: "Sign In", href: "/login" },
                { label: "Register Company", href: "/construction/register" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/40 transition-colors hover:text-white/80">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/#about" },
                { label: "Contact", href: "#contact" },
                { label: "Home", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/40 transition-colors hover:text-white/80">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/25 sm:flex-row">
          <p>© {new Date().getFullYear()} BuildPro Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white/50">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/50">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
