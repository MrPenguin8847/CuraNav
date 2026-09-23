"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListFilter, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { HospitalCard } from "@/components/HospitalCard";
import { CompareBar } from "@/components/CompareBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Hospital } from "@/lib/mockHospitals";
import { Suspense } from "react";
import { ManualFilters } from "@/components/ManualFilters";

type SortKey = "match" | "cost" | "distance" | "verified";

const SORT_LABELS: Record<SortKey, string> = {
  match: "Best Match",
  cost: "Lowest Cost",
  distance: "Nearest",
  verified: "Most Verified",
};

const VERIFICATION_ORDER: Record<string, number> = {
  verified: 0,
  pending: 1,
  simulated: 2,
};

// ─── Inner component (reads searchParams) ─────────────────────────────────────
function SearchResultsInner() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";

  // ── Data fetching state ───────────────────────────────────────────────────
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{ query: string; chips: any[] } | null>(null);
  const [nlFilters, setNlFilters] = useState<Record<string, string | number | null>>({}); // NL-extracted filters

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortKey>("match");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareWarning, setCompareWarning] = useState(false);
  const [showManualFilters, setShowManualFilters] = useState(false);

  // ── Location prompt state ─────────────────────────────────────────────────
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pendingNlData, setPendingNlData] = useState<any>(null);
  const router = useRouter();

  // ── Fetch from /api/hospitals ─────────────────────────────────────────────
  const fetchHospitals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("loc");

      let fallbackCities: string[] = [];

      if (rawQuery) {
        // Call natural language API
        const locParam = searchParams.get("loc");
        const nlRes = await fetch("/api/search/natural-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: rawQuery,
            locationContext: locParam
          })
        });


        if (nlRes.ok) {
          const nlData = await nlRes.json();
          setExplanation(nlData.explanation);

          // Detect location-intent queries that need geolocation
          const queryLower = rawQuery.toLowerCase();
          const needsLocation = (queryLower.includes("near me") || queryLower.includes("nearby") || queryLower.includes("closest") || queryLower.includes("nearest")) && !searchParams.get("loc") && !nlData.filters.city;

          if (needsLocation) {
            setPendingNlData(nlData);
            setShowLocationPrompt(true);
            setIsLoading(false);
            return; // Stop here — wait for user to provide location
          }

          if (nlData.filters.condition) params.set("condition", nlData.filters.condition);
          if (nlData.filters.specialty) params.set("specialty", nlData.filters.specialty);
          if (nlData.filters.city) params.set("city", nlData.filters.city);
          if (nlData.filters.radius_km) params.set("radius_km", nlData.filters.radius_km.toString());
          if (nlData.filters.min_budget) params.set("min_budget", nlData.filters.min_budget.toString());
          if (nlData.filters.max_budget) params.set("max_budget", nlData.filters.max_budget.toString());
          if (nlData.filters.facilities) params.set("facilities", nlData.filters.facilities);
          if (nlData.filters.sort_by) {
            setSort(nlData.filters.sort_by as SortKey);
          }
          if (Array.isArray(nlData.filters.fallback_cities)) {
            fallbackCities = nlData.filters.fallback_cities;
          }

          // Store NL-extracted filters in state so activeFilters (and HospitalCard) can use them
          setNlFilters({
            condition: nlData.filters.condition ?? null,
            specialty: nlData.filters.specialty ?? null,
            city: nlData.filters.city ?? null,
            radius_km: nlData.filters.radius_km ?? null,
            min_budget: nlData.filters.min_budget ?? null,
            max_budget: nlData.filters.max_budget ?? null,
            facilities: nlData.filters.facilities ?? null,
          });
        }
      }

      const url = `/api/hospitals${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: { hospitals: Hospital[]; count: number } = await res.json();

      let finalData = data;

      // Fallback if location filter is too restrictive
      if (data.hospitals.length === 0 && params.has("city")) {
        // If we have nearby fallback cities, try them!
        if (fallbackCities.length > 0) {
          console.warn(`No hospitals found in requested city. Fetching fallback cities: ${fallbackCities.join(", ")}`);
          params.set("city", fallbackCities.join(","));

          const fallbackUrl = `/api/hospitals${params.toString() ? `?${params.toString()}` : ""}`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            if (fbData.hospitals.length > 0) {
              finalData = fbData;
              // Inform the user via explanation chips that location was broadened
              setExplanation((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  chips: prev.chips.map((c: any) =>
                    c.label === "Location" ? { ...c, value: `${c.value} (Not found - Showing nearby: ${fallbackCities.join(", ")})` } : c
                  )
                };
              });
            }
          }
        }
      }

      setHospitals(finalData.hospitals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [rawQuery, searchParams]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // ── Sorted results ─────────────────────────────────────────────────────────
  const sortedHospitals = useMemo(() => {
    const arr = [...hospitals];
    switch (sort) {
      case "cost":
        return arr.sort((a, b) => {
          if (a.costMin == null && b.costMin == null) return 0;
          if (a.costMin == null) return 1; // nulls at the end
          if (b.costMin == null) return -1;
          return a.costMin - b.costMin;
        });
      case "distance":
        return arr.sort((a, b) => {
          if (a.distance_km != null && b.distance_km != null) {
            return a.distance_km - b.distance_km;
          }
          if (a.distance_km != null) return -1;
          if (b.distance_km != null) return 1;

          const locA = a.city ?? a.address ?? "";
          const locB = b.city ?? b.address ?? "";
          return locA.localeCompare(locB);
        });
      case "verified":
        return arr.sort(
          (a, b) =>
            (VERIFICATION_ORDER[a.verificationStatus] ?? 9) -
            (VERIFICATION_ORDER[b.verificationStatus] ?? 9)
        );
      default:
        return arr; // "match" — keep API order (ranked by backend)
    }
  }, [hospitals, sort]);

  // hospitalNames map for the compare bar labels
  const hospitalNames = useMemo(
    () => Object.fromEntries(hospitals.map((h) => [h.hospitalId, h.name])),
    [hospitals]
  );

  // ── Compare logic (max 3) ──────────────────────────────────────────────────
  const handleToggleCompare = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) {
        setCompareWarning(true);
        setTimeout(() => setCompareWarning(false), 3000);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleEditSearch = () => {
    setShowManualFilters(!showManualFilters);
    if (!showManualFilters) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resultCount = sortedHospitals.length;
  const showEmpty = !isLoading && !error && resultCount === 0;

  const activeFilters = useMemo(() => {
    // Merge URL params (manual filters) with NL-extracted filters (from natural-language query)
    // URL params take priority over NL-extracted ones if both exist
    return {
      condition: searchParams.get("condition") ?? (nlFilters.condition as string | null) ?? null,
      specialty: searchParams.get("specialty") ?? (nlFilters.specialty as string | null) ?? null,
      city: searchParams.get("city") ?? (nlFilters.city as string | null) ?? null,
      radius_km: searchParams.get("radius_km") ? Number(searchParams.get("radius_km")) : (nlFilters.radius_km as number | null) ?? null,
      min_budget: searchParams.get("min_budget") ? Number(searchParams.get("min_budget")) : (nlFilters.min_budget as number | null) ?? null,
      max_budget: searchParams.get("max_budget") ? Number(searchParams.get("max_budget")) : (nlFilters.max_budget as number | null) ?? null,
      facilities: searchParams.get("facilities") ?? (nlFilters.facilities as string | null) ?? null,
      sort_by: sort, // Use React state, not URL param
    };
  }, [searchParams, nlFilters, sort]);

  // ── Location prompt handler ──────────────────────────────────────────────
  const handleLocationGrant = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "CuraNav/1.0" } }
          );
          const data = await res.json();
          const detectedCity = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? "";
          if (detectedCity) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("loc", detectedCity);
            currentUrl.searchParams.set("lat", latitude.toString());
            currentUrl.searchParams.set("lon", longitude.toString());
            setShowLocationPrompt(false);
            setPendingNlData(null);
            router.replace(currentUrl.pathname + currentUrl.search);
          }
        } catch {
          // Fall through — just continue without location
          setShowLocationPrompt(false);
          continueWithoutLocation();
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setShowLocationPrompt(false);
        continueWithoutLocation();
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const continueWithoutLocation = useCallback(() => {
    setShowLocationPrompt(false);
    if (pendingNlData) {
      // Re-trigger fetch without location requirement
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("loc", "skip");
      router.replace(currentUrl.pathname + currentUrl.search);
    }
  }, [pendingNlData, router]);

  return (
    <div className={`min-h-screen flex flex-col bg-background font-sans ${selectedIds.length > 0 ? "pb-20" : ""}`}>
      <Header />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back to search */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        {/* ── 1. EXPLAINABILITY PANEL ── */}
        <section className="mb-6" aria-label="Search interpretation">
          <ExplainabilityPanel onEditSearch={handleEditSearch} explanation={explanation} />
        </section>

        {/* ── MANUAL FILTERS TOGGLE ── */}
        {showManualFilters && (
          <section className="mb-6" aria-label="Manual Filters">
            <ManualFilters />
          </section>
        )}

        {/* ── 2. RESULTS TOOLBAR ── */}
        {!isLoading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-foreground">
                {resultCount} hospital{resultCount !== 1 ? "s" : ""} match your search
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <label htmlFor="sort-select" className="text-xs font-medium text-slate-400">
                  Sort by:
                </label>
              </div>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="text-sm font-semibold text-foreground glass bg-background/50 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key} className="bg-background text-foreground">
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Compare limit warning toast */}
        {compareWarning && (
          <div className="mb-4 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl text-sm font-medium text-warning flex items-center gap-2">
            <span>⚠️</span>
            <span>You can compare up to 5 hospitals at a time. Remove one to add another.</span>
          </div>
        )}

        {/* ── 3. RESULTS LIST ── */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="card p-8 text-center space-y-4">
            <p className="text-foreground font-semibold">Something went wrong loading results.</p>
            <p className="text-sm text-slate-400">{error}</p>
            <button onClick={fetchHospitals} className="btn-primary">
              Retry
            </button>
          </div>
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <section className="space-y-4" aria-label="Hospital results">
            {sortedHospitals.map((hospital, index) => (
              <HospitalCard
                key={hospital.hospitalId}
                hospital={hospital}
                isSelected={selectedIds.includes(hospital.hospitalId)}
                onToggleCompare={handleToggleCompare}
                compareCount={selectedIds.length}
                activeFilters={activeFilters}
                rankIndex={index}
              />
            ))}
          </section>
        )}

        {/* ── LOCATION PROMPT MODAL ── */}
        {showLocationPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="glass bg-background/90 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Enable Location</h2>
                <p className="text-muted-foreground text-sm">
                  Your search includes <span className="font-semibold text-foreground">"near me"</span>. To show hospitals closest to you, we need your location.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleLocationGrant}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {locating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Detecting location...</>
                  ) : (
                    <><MapPin className="w-5 h-5" /> Allow Location Access</>
                  )}
                </button>
                <button
                  onClick={continueWithoutLocation}
                  className="w-full px-6 py-3 text-muted-foreground font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm"
                >
                  Skip — show all results instead
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* ── 4. STICKY COMPARE BAR ── */}
      <CompareBar
        selectedIds={selectedIds}
        hospitalNames={hospitalNames}
        onRemove={handleRemoveFromCompare}
      />
    </div>
  );
}

// ─── Suspense wrapper (required for useSearchParams in App Router) ─────────────
export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-background font-sans">
          <Header />
          <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
            <LoadingState />
          </main>
          <Footer />
        </div>
      }
    >
      <SearchResultsInner />
    </Suspense>
  );
}
