"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Menu, X, Siren } from "lucide-react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Cura<span className="text-primary">Nav</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-primary relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full">
            Home
          </Link>
          <Link href="/find-hospital" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Find Hospital
          </Link>
          <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            All Hospitals
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            About Us
          </Link>
          <Link href="/#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/emergency"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-error px-3 py-2 rounded-lg hover:bg-error/10 transition-colors"
          >
            <Siren className="w-4 h-4" />
            Emergency
          </Link>
          <Link href="/admin" className="btn-primary text-sm py-2">
            Admin Log In
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 glass animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-3">
            <Link href="/" className="text-sm font-medium text-primary py-2" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/find-hospital" className="text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Find Hospital</Link>
            <Link href="/search" className="text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>All Hospitals</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link href="/#faq" className="text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>FAQ</Link>
            <hr className="border-white/10" />
            <Link
              href="/emergency"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-error py-2"
              onClick={() => setMobileOpen(false)}
            >
              <Siren className="w-4 h-4" />
              Emergency
            </Link>
            <Link href="/admin" className="btn-primary text-sm text-center" onClick={() => setMobileOpen(false)}>Admin Log In</Link>
          </div>
        </div>
      )}
    </header>
  );
}
