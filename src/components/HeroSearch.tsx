"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Shield, Loader2, Filter, IndianRupee, Stethoscope, Pill, Activity, Info, Database, HeartPulse } from "lucide-react";
import { getEstimatedCost } from "@/lib/costEstimator";
import { usePlatformStats } from "@/hooks/usePlatformStats";

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

  // Manual filter state
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [facilities, setFacilities] = useState({
    ICU: false,
    Emergency: false,
    Dialysis: false,
    NICU: false,
  });

  const suggestedCost = specialty ? getEstimatedCost(specialty) : null;

  useEffect(() => {
    const q = condition.toLowerCase();
    if (!q) return;
    if (q.includes("heart") || q.includes("cardiac") || q.includes("cardio")) setSpecialty("Cardiology");
    else if (q.includes("kidney") || q.includes("dialysis") || q.includes("renal")) setSpecialty("Nephrology");
    else if (q.includes("cancer") || q.includes("tumor") || q.includes("oncol") || q.includes("chemo")) setSpecialty("Oncology");
    else if (q.includes("bone") || q.includes("joint") || q.includes("ortho") || q.includes("fracture")) setSpecialty("Orthopedics");
    else if (q.includes("brain") || q.includes("neuro") || q.includes("stroke") || q.includes("nerve")) setSpecialty("Neurology");
    else if (q.includes("child") || q.includes("pediatric") || q.includes("baby") || q.includes("infant")) setSpecialty("Pediatrics");
    else if (q.includes("eye") || q.includes("vision") || q.includes("cataract") || q.includes("opthal")) setSpecialty("Ophthalmology");
    else if (q.includes("skin") || q.includes("derma") || q.includes("acne")) setSpecialty("Dermatology");
    else if (q.includes("tooth") || q.includes("teeth") || q.includes("dental") || q.includes("dentist")) setSpecialty("Dentistry");
    else if (q.includes("stomach") || q.includes("digest") || q.includes("gastro")) setSpecialty("Gastroenterology");
    else if (q.includes("lung") || q.includes("breath") || q.includes("asthma") || q.includes("pulmo")) setSpecialty("Pulmonology");
    else if (q.includes("women") || q.includes("pregnan") || q.includes("matern") || q.includes("gyne")) setSpecialty("Gynecology");
  }, [condition]);

  const handleFacilityChange = (fac: keyof typeof facilities) => {
    setFacilities(prev => ({ ...prev, [fac]: !prev[fac] }));
  };

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

  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) {
      params.set("city", city.trim());
      if (locationCoords && locationLabel && locationLabel.toLowerCase().includes(city.trim().toLowerCase())) {
        params.set("lat", locationCoords.lat.toString());
        params.set("lon", locationCoords.lon.toString());
      }
    }
    if (condition.trim()) params.set("condition", condition.trim());
    if (specialty.trim()) params.set("specialty", specialty.trim());
    if (maxBudget.trim()) params.set("max_budget", maxBudget.trim());

    const selectedFacilities = Object.entries(facilities)
      .filter(([_, isSelected]) => isSelected)
      .map(([fac]) => fac);
    if (selectedFacilities.length > 0) {
      params.set("facilities", selectedFacilities.join(","));
    }

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
            setLocationCoords({ lat: latitude, lon: longitude });
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
    "General Surgery",
    "Orthopaedics",
    "Emergency",
    "Burns",
    "Kidney & Dialysis",
  ];

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
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 px-4 py-2 glass bg-background/50 border border-white/10 rounded-full text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
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
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-medium transition-all duration-200 ${showFilters
                    ? "bg-primary text-white border-primary"
                    : "glass bg-background/50 border-white/10 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
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
                    onClick={() => {
                      setLocationLabel(null);
                      setLocationCoords(null);
                    }}
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
                className="glass bg-background/50 border border-white/10 rounded-2xl p-5 mb-4 animate-fade-in space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="filter-city" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <MapPin className="w-3 h-3" /> City / Location
                    </label>
                    <input
                      id="filter-city"
                      name="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Delhi"
                      className="w-full px-3 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="filter-condition" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Pill className="w-3 h-3" /> Disease / Condition
                    </label>
                    <input
                      id="filter-condition"
                      name="condition"
                      type="text"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="e.g. Heart attack, Kidney failure"
                      className="w-full px-3 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="filter-specialty" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Stethoscope className="w-3 h-3" /> Specialty (Auto-detected)
                    </label>
                    <input
                      id="filter-specialty"
                      name="specialty"
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology"
                      className="w-full px-3 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="filter-budget" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <IndianRupee className="w-3 h-3" /> Max Budget (₹)
                    </label>
                    <input
                      id="filter-budget"
                      name="maxBudget"
                      type="number"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    />
                    {suggestedCost && (
                      <div className="mt-1.5 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-400 leading-tight">
                          Estimated: <strong>₹{suggestedCost.min.toLocaleString('en-IN')} – ₹{suggestedCost.max.toLocaleString('en-IN')}</strong> for {specialty}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Required Facilities */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Activity className="w-3 h-3" /> Required Facilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(facilities).map((fac) => (
                      <label
                        key={fac}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${facilities[fac as keyof typeof facilities]
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-background border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/5"
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={facilities[fac as keyof typeof facilities]}
                          onChange={() => handleFacilityChange(fac as keyof typeof facilities)}
                        />
                        {fac}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setCity(""); setCondition(""); setSpecialty(""); setMaxBudget(""); setFacilities({ ICU: false, Emergency: false, Dialysis: false, NICU: false }); }}
                    className="px-4 py-2.5 border border-white/10 text-muted-foreground rounded-xl text-xs font-semibold hover:bg-white/5 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    Search with Filters
                  </button>
                </div>
              </form>
            )}


          </div>

          {/* Right: Image Collage */}
          <div className="hidden lg:block animate-slide-in-right relative">
            {/* Main image card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 glass border border-white/5">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                {/* Decorative medical illustration */}
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto rounded-full glass flex items-center justify-center mb-6">
                    <Building2 className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">PM-JAY Hospital Index</h3>
                  <p className="text-sm text-muted-foreground">
                    {statsLoading ? "Loading..." : `${stats.totalHospitals} hospitals · ${stats.totalSpecialties} specialties`}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating stats cards — all live from DB */}
            <div className="absolute -left-6 top-8 glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 p-4 border border-white/5 animate-float">
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

            <div className="absolute -right-4 bottom-12 glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 p-4 border border-white/5 animate-float" style={{ animationDelay: "2s" }}>
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

            <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 glass bg-background/80 rounded-2xl shadow-2xl shadow-black/20 px-5 py-3 border border-white/5 animate-float" style={{ animationDelay: "4s" }}>
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
