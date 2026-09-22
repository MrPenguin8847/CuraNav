import Link from "next/link";
import { Activity, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Services: [
    { label: "Cardiology", href: "/search?q=cardiology" },
    { label: "Neurology", href: "/search?q=neurology" },
    { label: "Orthopedics", href: "/search?q=orthopedics" },
    { label: "Oncology", href: "/search?q=oncology" },
    { label: "Nephrology", href: "/search?q=nephrology" },
  ],
  Company: [
    { label: "About Us", href: "#how-it-works" },
    { label: "Our Mission", href: "#" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Contact Us", href: "#" },
  ],
  Support: [
    { label: "FAQ", href: "#faq" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Disclaimer", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Cura<span className="text-primary-light">Nav</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              CuraNav helps you discover and compare hospitals with transparent, AI-powered search.
              We don&apos;t diagnose or recommend — we inform.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-primary-light" />
                <span>contact@curanav.in</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-primary-light" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-primary-light" />
                <span>Chandigarh, India</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-primary-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 CuraNav. All rights reserved. Prototype for TECHNOVA 2026 — Responsible AI Theme.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-primary-light/80 uppercase tracking-wider bg-primary/20 px-3 py-1 rounded-full">
              Prototype
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
