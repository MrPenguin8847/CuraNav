"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Users, Building2, Shield, Loader2, Filter, IndianRupee, Stethoscope } from "lucide-react";

interface HeroSearchProps {
  query: string;
  setQuery: (q: string) => void;
}

export function HeroSearch({ query, setQuery }: HeroSearchProps) {
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Manual filter state
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      const locationContext = locationLabel
        ? `&loc=${encodeURIComponent(locationLabel)}`
        : "";
      router.push(`/search?q=${encodeURIComponent(query)}${locationContext}`);
    }
  };

  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (specialty) params.set("condition", specialty);
    if (maxBudget) params.set("max_budget", maxBudget);
    router.push(`/search?${params.toString()}`);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "CuraNav/1.0" } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            "";
          const state = data.address?.state ?? "";
          const label = [detectedCity, state].filter(Boolean).join(", ");
          if (label) {
            setLocationLabel(label);
            setCity(detectedCity); // auto-fill filter city
            setLocError(null);
          } else {
            setLocError("Could not determine your city");
          }
        } catch {
          setLocError("Failed to detect location");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Location permission denied");
        } else {
          setLocError("Could not get your location");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
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

            <p className="text-lg text-slate-500 leading-relaxed max-w-lg mb-8">
              Find, compare, and navigate trusted hospitals and treatments
              tailored to your specific needs, budget, and location — powered by
              transparent AI.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative mb-3">
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

            {/* Location + Filter toggle row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                {locating ? "Detecting…" : "📍 Use my location"}
              </button>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-medium transition-all duration-200 ${
                  showFilters
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {showFilters ? "Hide Filters" : "🔍 Manual Filters"}
              </button>

              {locationLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/20">
                  <MapPin className="w-3 h-3" />
                  {locationLabel}
                  <button
                    type="button"
                    onClick={() => setLocationLabel(null)}
                    className="ml-1 text-success/60 hover:text-success transition-colors text-sm leading-none"
                    aria-label="Remove location"
                  >
                    ×
                  </button>
                </span>
              )}

              {locError && (
                <span className="text-xs text-warning font-medium">⚠️ {locError}</span>
              )}
            </div>

            {/* ── Inline Manual Filters ── */}
            {showFilters && (
              <form
                onSubmit={handleFilterSearch}
                className="bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 mb-4 animate-fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      <MapPin className="w-3 h-3" /> City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chandigarh"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      <Stethoscope className="w-3 h-3" /> Specialty
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      <IndianRupee className="w-3 h-3" /> Max Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCity(""); setSpecialty(""); setMaxBudget(""); }}
                    className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Search with Filters
                  </button>
                </div>
              </form>
            )}

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
