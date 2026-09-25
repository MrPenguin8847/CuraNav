"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Shield, Loader2, Filter, Stethoscope, Database, HeartPulse } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { getStoredLocation, storeLocation, clearStoredLocation } from "@/lib/userLocation";

interface HeroSearchProps {
  query: string;
  setQuery: (q: string) => void;
}

export function HeroSearch({ query, setQuery }: HeroSearchProps) {
  const router = useRouter();
  const { stats, loading: statsLoading } = usePlatformStats();
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Restore the user's previously saved location so it is sent with every search.
  useEffect(() => {
    const saved = getStoredLocation();
    if (saved) {
      setLocationLabel(saved.label);
      setLocationCoords({ lat: saved.lat, lon: saved.lon });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      const locationContext = locationLabel
        ? `&loc=${encodeURIComponent(locationLabel)}`
        : "";
      const coordsContext = locationCoords
        ? `&lat=${locationCoords.lat}&lon=${locationCoords.lon}`
        : "";
      router.push(`/search?q=${encodeURIComponent(query)}${locationContext}${coordsContext}`);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const label = "Current location";
        const coords = { lat: latitude, lon: longitude };

        setLocationLabel(label);
        setLocationCoords(coords);
        storeLocation({ ...coords, label });

        const params = new URLSearchParams({
          loc: label,
          lat: latitude.toString(),
          lon: longitude.toString(),
        });

        setLocating(false);
        router.push(`/search?${params.toString()}`);
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

  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text + Search */}
          <div className="animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                AI-Powered Hospital Discovery
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
              Find the Right{" "}
              <span className="gradient-text text-gradient-brand">Hospital</span> for You
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mb-8">
              Search {stats.totalHospitals > 0 ? `${stats.totalHospitals} PM-JAY empanelled hospitals` : 'hospitals'} across {stats.totalSpecialties > 0 ? `${stats.totalSpecialties} specialties` : 'specialties'}. Compare costs, outcomes, and certifications — powered by transparent AI.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative mb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <label htmlFor="search-query" className="sr-only">Search query</label>
                  <input
                    id="search-query"
                    name="q"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for hospitals, conditions, treatments..."
                    className="w-full pl-12 pr-4 py-4 glass bg-background/80 border border-white/10 rounded-xl text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground text-foreground"
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
            <div className="mb-5 max-w-2xl space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  aria-busy={locating}
                  className="group flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-4 py-2.5 text-left text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none">
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {locating ? "Finding nearby hospitals…" : "Use my location"}
                    </span>
                    <span className="mt-0 block text-[11px] font-medium text-primary-foreground/75">
                      Show all hospitals near you
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/find-hospital")}
                  aria-label="Open manual filters"
                  className="group flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-foreground bg-foreground px-4 py-2.5 text-left text-sm font-bold text-background shadow-md shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-primary/20 active:translate-y-0 motion-reduce:transform-none"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10 transition-colors duration-300 group-hover:bg-primary-foreground/15">
                    <Filter className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6 motion-reduce:transform-none" />
                  </span>
                  <span className="min-w-0">
                    <span className="block">Manual filters</span>
                    <span className="mt-0 block text-[11px] font-medium text-background/65 group-hover:text-primary-foreground/75">
                      Filter by condition, budget & facilities
                    </span>
                  </span>
                </button>
              </div>

              {(locationLabel || locError) && (
                <div className="flex flex-wrap items-center gap-2" aria-live="polite">
                  {locationLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <MapPin className="h-3 w-3" />
                      {locationLabel}
                      <button
                        type="button"
                        onClick={() => {
                          setLocationLabel(null);
                          setLocationCoords(null);
                          clearStoredLocation();
                        }}
                        className="ml-1 text-sm leading-none text-success/60 transition-colors hover:text-success"
                        aria-label="Remove location"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {locError && (
                    <span role="alert" className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                      {locError}
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right: Image Collage */}
          <div className="hidden lg:block animate-slide-in-right relative">
            {/* Main image card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 glass border border-white/5 isolate">
              <div className="aspect-[4/3] relative">
                <img
                  src="/images.jpg"
                  alt="Modern hospital exterior at night"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/30 to-sky-900/25" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="max-w-[12rem] rounded-2xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-sm shadow-2xl">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Building2 className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                        Hospital Index
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">PM-JAY Network</h3>
                    <p className="text-sm text-slate-200">
                      {statsLoading ? "Loading..." : `${stats.totalHospitals} hospitals · ${stats.totalSpecialties} specialties`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stats cards — all live from DB */}
            <div className="absolute left-4 top-4 z-10 glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 p-4 border border-white/5 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{statsLoading ? "..." : stats.withCostData}</p>
                  <p className="text-xs text-muted-foreground">With Cost Data</p>
                </div>
              </div>
            </div>

            <div className="absolute right-4 top-4 z-10 glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 p-4 border border-white/5 animate-float" style={{ animationDelay: "2s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{statsLoading ? "..." : stats.pmjayEmpanelled}</p>
                  <p className="text-xs text-muted-foreground">PM-JAY Listed</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 max-w-[13rem] glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 px-4 py-3 border border-white/5 animate-float" style={{ animationDelay: "4s" }}>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {statsLoading ? "Loading specialties..." : `${stats.totalSpecialties} medical specialties indexed`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
