"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListFilter, SlidersHorizontal } from "lucide-react";
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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortKey>("match");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareWarning, setCompareWarning] = useState(false);

  // ── Fetch from /api/hospitals ─────────────────────────────────────────────
  const fetchHospitals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");

      if (rawQuery) {
        // Call natural language API
        const nlRes = await fetch("/api/search/natural-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: rawQuery })
        });
        
        if (nlRes.ok) {
          const nlData = await nlRes.json();
          setExplanation(nlData.explanation);
          
          if (nlData.filters.condition) params.set("condition", nlData.filters.condition);
          if (nlData.filters.specialty) params.set("specialty", nlData.filters.specialty);
          if (nlData.filters.city) params.set("city", nlData.filters.city);
          if (nlData.filters.max_budget) params.set("max_budget", nlData.filters.max_budget);
          if (nlData.filters.facilities) params.set("facilities", nlData.filters.facilities);
        }
      }

      const url = `/api/hospitals${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: { hospitals: Hospital[]; count: number } = await res.json();
      setHospitals(data.hospitals);
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
        // No distance_km in new schema; fall back to city/address alphabetical
        return arr.sort((a, b) => {
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

  const handleEditSearch = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const resultCount = sortedHospitals.length;
  const showEmpty = !isLoading && !error && resultCount === 0;

  return (
    <div className={`min-h-screen flex flex-col bg-background font-sans ${selectedIds.length > 0 ? "pb-20" : ""}`}>
      <Header />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back to search */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        {/* ── 1. EXPLAINABILITY PANEL ── */}
        <section className="mb-6" aria-label="Search interpretation">
          <ExplainabilityPanel onEditSearch={handleEditSearch} explanation={explanation} />
        </section>

        {/* ── MANUAL FILTERS ── */}
        <ManualFilters />

        {/* ── 2. RESULTS TOOLBAR ── */}
        {!isLoading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-muted" />
              <p className="text-sm font-semibold text-foreground">
                {resultCount} hospital{resultCount !== 1 ? "s" : ""} match your search
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted" />
                <label htmlFor="sort-select" className="text-xs font-medium text-muted">
                  Sort by:
                </label>
              </div>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="text-sm font-semibold text-foreground bg-white border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
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
            <p className="text-sm text-muted">{error}</p>
            <button onClick={fetchHospitals} className="btn-primary">
              Retry
            </button>
          </div>
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <section className="space-y-4" aria-label="Hospital results">
            {sortedHospitals.map((hospital) => (
              <HospitalCard
                key={hospital.hospitalId}
                hospital={hospital}
                isSelected={selectedIds.includes(hospital.hospitalId)}
                onToggleCompare={handleToggleCompare}
                compareCount={selectedIds.length}
              />
            ))}
          </section>
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
