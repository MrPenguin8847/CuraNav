"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Menu, X } from "lucide-react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
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
          <Link href="/search" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            Services
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            About Us
          </Link>
          <Link href="#faq" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/admin/login" className="btn-ghost text-sm">
            Log In
          </Link>
          <Link href="/admin" className="btn-primary text-sm py-2">
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-3">
            <Link href="/" className="text-sm font-medium text-primary py-2" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/search" className="text-sm font-medium text-slate-500 py-2" onClick={() => setMobileOpen(false)}>Services</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-500 py-2" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link href="#faq" className="text-sm font-medium text-slate-500 py-2" onClick={() => setMobileOpen(false)}>Contact</Link>
            <hr className="border-slate-100" />
            <Link href="/admin/login" className="text-sm font-medium text-slate-600 py-2" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Link href="/admin" className="btn-primary text-sm text-center" onClick={() => setMobileOpen(false)}>Sign Up</Link>
          </div>
        </div>
      )}
    </header>
  );
}
