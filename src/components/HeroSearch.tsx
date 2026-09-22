"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Users, Building2, Shield } from "lucide-react";

interface HeroSearchProps {
  query: string;
  setQuery: (q: string) => void;
}

export function HeroSearch({ query, setQuery }: HeroSearchProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const quickLinks = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Oncology",
    "Pediatrics",
    "Nephrology",
  ];

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text + Search */}
          <div className="animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Trusted Healthcare Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
              Your Health{" "}
              <span className="gradient-text">Expertly Managed</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-lg mb-10">
              Find, compare, and navigate trusted hospitals and treatments
              tailored to your specific needs, budget, and location — powered by
              transparent AI.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for hospitals, conditions, treatments..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary px-8 py-4 text-base whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => setQuery(link + " hospitals near me")}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Image Collage */}
          <div className="hidden lg:block animate-slide-in-right relative">
            {/* Main image card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-slate-100">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary-light to-secondary/10 flex items-center justify-center">
                {/* Decorative medical illustration */}
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
                    <Building2 className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Premium Healthcare</h3>
                  <p className="text-sm text-slate-500">Compare 25+ hospitals across India</p>
                </div>
              </div>
            </div>

            {/* Floating stats cards */}
            <div className="absolute -left-6 top-8 bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-4 border border-slate-100 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">1000+</p>
                  <p className="text-xs text-slate-500">Happy Patients</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-12 bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-4 border border-slate-100 animate-float" style={{ animationDelay: "2s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">4.8/5</p>
                  <p className="text-xs text-slate-500">User Rating</p>
                </div>
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 bg-white rounded-2xl shadow-xl shadow-slate-200/60 px-5 py-3 border border-slate-100 animate-float" style={{ animationDelay: "4s" }}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Available across 10+ cities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
