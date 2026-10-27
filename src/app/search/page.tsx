"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListFilter, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { SearchNotices } from "@/components/SearchNotices";
import { HospitalCard } from "@/components/HospitalCard";
import { CompareBar } from "@/components/CompareBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { LoadErrorState } from "@/components/LoadErrorState";
import { Hospital } from "@/lib/mockHospitals";
import { Suspense } from "react";
import { ManualFilters } from "@/components/ManualFilters";
import { getStoredLocation, storeLocation } from "@/lib/userLocation";
import { fetchWithTimeout, isTimeoutError, RequestTimeoutError } from "@/lib/fetchWithTimeout";
import { describeError, type LoadFailure, type LoadStatus } from "@/lib/loadState";
import { getPositionWithDeadline } from "@/lib/geolocation";
import {
  buildTransparencyNotices,
  intentToChips,
  intentToQueryParams,
  type SearchIntent,
  type TransparencyNotice,
} from "@/lib/searchIntent";

/** The NL structuring call is itself budgeted server-side; this is the outer net. */
const NL_TIMEOUT_MS = 10_000;
const HOSPITALS_TIMEOUT_MS = 12_000;
/** Bounds the location permission prompt; see `getPositionWithDeadline`. */
const GEOLOCATION_TIMEOUT_MS = 8_000;

type HospitalsResponse = {
  hospitals: Hospital[];
  count: number;
  notes?: string[];
  relaxed?: boolean;
};

type NlResponse = {
  intent: SearchIntent;
  chips: { icon: string; label: string; value: string }[];
  notices: TransparencyNotice[];
  explanation: {
    query: string;
    extractor: string;
    usedLocalFallback: boolean;
    wantsNearby: boolean;
    elapsed_ms: number;
  };
};

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

type SortKey = "match" | "cost" | "distance" | "verified";

// ─── Inner component (reads searchParams) ─────────────────────────────────────
function SearchResultsInner() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";

  // ── Data fetching state ───────────────────────────────────────────────────
  // One discriminant instead of `isLoading` + `error`, so the "nothing loading,
  // nothing failed, nothing arrived" state is not representable.
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [explanation, setExplanation] = useState<{
    query: string;
    chips: { icon: string; label: string; value: string }[];
  } | null>(null);
  const [notices, setNotices] = useState<TransparencyNotice[]>([]);
  const [serverNotes, setServerNotes] = useState<string[]>([]);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [nlFilters, setNlFilters] = useState<Record<string, string | number | null>>({});

  const isLoading = status === "loading";

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortKey>("match");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareWarning, setCompareWarning] = useState(false);
  const [showManualFilters, setShowManualFilters] = useState(false);

  // ── Location prompt state ─────────────────────────────────────────────────
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pendingNlData, setPendingNlData] = useState<any>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const router = useRouter();

  // ── Fetch from /api/hospitals ─────────────────────────────────────────────
  const fetchHospitals = useCallback(async () => {
    setStatus("loading");
    setFailure(null);
    setServerNotes([]);

    // One controller for the whole search, so navigating away or a stalled
    // upstream can never leave this effect waiting forever.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, NL_TIMEOUT_MS + HOSPITALS_TIMEOUT_MS + 2_000);

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("loc");
      params.delete("lat");
      params.delete("lon");
      params.delete("urgency");

      // Resolve the user's location from URL params or their saved location so it
      // can be sent with this request (and every subsequent search).
      const storedLoc = typeof window !== "undefined" ? getStoredLocation() : null;
      const urlLoc = searchParams.get("loc");
      const urlLat = searchParams.get("lat");
      const urlLon = searchParams.get("lon");
      const locSkipped = urlLoc === "skip";
      const effectiveLoc =
        urlLoc && urlLoc !== "skip" ? urlLoc : storedLoc?.label ?? null;

      if (rawQuery) {
        // ── Natural-language structuring ───────────────────────────────────
        // The route returns a typed intent plus explicit notices about anything
        // it could not resolve. A failure here is not fatal: the search still
        // runs on the URL filters and the reason is shown to the user.
        try {
          const nlRes = await fetchWithTimeout(
            "/api/search/natural-language",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: rawQuery, locationContext: effectiveLoc }),
              signal: controller.signal,
            },
            NL_TIMEOUT_MS
          );

          if (nlRes.ok) {
            const nlData = (await nlRes.json()) as NlResponse;
            setIntent(nlData.intent);
            setNotices(nlData.notices ?? []);
            setExplanation({
              query: rawQuery,
              chips: nlData.chips ?? intentToChips(nlData.intent),
            });

            // A "near me" query with no location yet needs the consent prompt.
            const wantsLocation =
              nlData.explanation.wantsNearby && !effectiveLoc && !nlData.intent.location.value;

            if (wantsLocation) {
              setPendingNlData(nlData);
              setShowLocationPrompt(true);
              setStatus("success"); // stop the spinner; the modal drives the next step
              return; // Stop here — wait for the user to provide a location
            }

            // Only fields the intent actually resolved become filters.
            for (const [key, value] of intentToQueryParams(nlData.intent)) {
              params.set(key, value);
            }
            if (nlData.intent.sortBy.value) {
              setSort(nlData.intent.sortBy.value as SortKey);
            }

            setNlFilters({
              condition: nlData.intent.condition.value,
              specialty: nlData.intent.specialty.value,
              city: nlData.intent.location.value,
              radius_km: nlData.intent.radiusKm.value,
              min_budget: nlData.intent.budget.value?.min ?? null,
              max_budget: nlData.intent.budget.value?.max ?? null,
              facilities: nlData.intent.facilities.value?.join(",") ?? null,
            });
          } else {
            setNotices([
              {
                id: "nl-failed",
                severity: "info",
                message:
                  "We could not read your description automatically, so these results come from the filters already on the page.",
              },
            ]);
          }
        } catch (err) {
          console.warn("[search] natural-language structuring unavailable:", err);
          setNotices([
            {
              id: "nl-failed",
              severity: "info",
              message: isTimeoutError(err)
                ? "Reading your description took too long, so we fell back to the filters already on the page."
                : "We could not read your description automatically, so these results come from the filters already on the page.",
            },
          ]);
        }
      }

      // Send the user's coordinates with every search request so "near me"
      // searches match against hospital lat/lng and return nearest hospitals.
      if (!locSkipped) {
        const coords =
          urlLat && urlLon
            ? { lat: urlLat, lon: urlLon }
            : storedLoc
              ? { lat: String(storedLoc.lat), lon: String(storedLoc.lon) }
              : null;

        // Only apply coordinates when the search isn't pinned to an explicit city
        // name, otherwise the DB city-name match would be skipped for nothing.
        if (coords && !params.has("city")) {
          params.set("lat", coords.lat);
          params.set("lon", coords.lon);
          if (effectiveLoc) setLocationLabel(effectiveLoc);
        }
      }

      const url = `/api/hospitals${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetchWithTimeout(url, { signal: controller.signal }, HOSPITALS_TIMEOUT_MS);
      if (!res.ok) throw new Error(`The hospitals service returned an error (${res.status}).`);

      const data = (await res.json()) as HospitalsResponse;
      setHospitals(data.hospitals ?? []);
      setServerNotes(data.notes ?? []);
      setStatus("success");

      // The API reports a widened search itself, so the client does not have to
      // re-request with fallback cities and stitch two responses together.
      if (data.relaxed) {
        setNotices((prev) => [
          ...prev.filter((n) => n.id !== "location-broadened"),
          {
            id: "location-broadened",
            severity: "info" as const,
            message:
              "No hospital matched in the exact location you asked for, so we widened the search to nearby areas.",
          },
        ]);
      }
    } catch (err) {
      if (timedOut || isTimeoutError(err)) {
        setFailure(describeError(new RequestTimeoutError(NL_TIMEOUT_MS + HOSPITALS_TIMEOUT_MS)));
        setStatus("error");
      } else if (err instanceof Error && err.name === "AbortError") {
        return; // Superseded by a newer run; leave state to that run.
      } else {
        setFailure(describeError(err, "Something went wrong loading results."));
        setStatus("error");
      }
    } finally {
      clearTimeout(timer);
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

  /**
   * Triage hands off here with `urgency=<severity>`. It is deliberately NOT sent
   * to `/api/hospitals`: nothing in the dataset says how urgent a given hospital
   * is for a given patient, so filtering on it would dress an arbitrary list up
   * as a triage result. It is used only to warn the user.
   */
  const urgency = searchParams.get("urgency");
  const triageNotices = useMemo<TransparencyNotice[]>(() => {
    if (urgency === "emergency") {
      return [
        {
          id: "triage-emergency",
          severity: "warning",
          message:
            "Your symptom check flagged possible warning signs. The hospitals below are matched by specialty only \u2014 they are not ranked by how urgent your situation is. If this could be an emergency, call 108 or 112 now rather than choosing from a list.",
        },
      ];
    }
    if (urgency === "self_care") {
      return [
        {
          id: "triage-self-care",
          severity: "info",
          message:
            "Your symptom check suggested self-care may be enough. Hospitals are still listed below in case you would rather be seen.",
        },
      ];
    }
    return [];
  }, [urgency]);

  // Safety net: if the route could not report notices, derive them from the
  // intent on the client so the "what we could not do" copy is never missing.
  const effectiveNotices = useMemo<TransparencyNotice[]>(() => {
    const derived =
      notices.length > 0
        ? notices
        : intent
          ? buildTransparencyNotices(rawQuery, intent)
          : [];
    const known = new Set(derived.map((n) => n.id));
    return [...derived, ...triageNotices.filter((n) => !known.has(n.id))];
  }, [notices, intent, rawQuery, triageNotices]);

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
  const showEmpty = status === "success" && resultCount === 0;

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
    setLocating(true);
    getPositionWithDeadline(GEOLOCATION_TIMEOUT_MS, 10_000)
      .then(async ({ lat: latitude, lon: longitude }) => {
        let detectedCity = "";
        try {
          // Reverse geocoding is best-effort: if it fails or names no city we
          // still send the coordinates rather than stranding the user in the
          // modal with a button that appears to do nothing.
          const res = await fetchWithTimeout(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "CuraNav/1.0" } },
            3_000
          );
          const data = await res.json();
          detectedCity =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            "";
        } catch {
          detectedCity = "";
        }

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("loc", detectedCity || "Current location");
        currentUrl.searchParams.set("lat", latitude.toString());
        currentUrl.searchParams.set("lon", longitude.toString());
        storeLocation({ lat: latitude, lon: longitude, label: detectedCity || "Current location" });
        setShowLocationPrompt(false);
        setPendingNlData(null);
        setLocating(false);
        router.replace(currentUrl.pathname + currentUrl.search);
      })
      .catch(() => {
        setLocating(false);
        setShowLocationPrompt(false);
        continueWithoutLocation();
      });
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
    <div className={`min-h-screen flex flex-col bg-transparent font-sans ${selectedIds.length > 0 ? "pb-20" : ""}`}>
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

        {/* Every deviation from the request is stated, not silently applied. */}
        {!isLoading && (effectiveNotices.length > 0 || serverNotes.length > 0) && (
          <section className="mb-6" aria-label="Search limitations">
            <SearchNotices notices={effectiveNotices} serverNotes={serverNotes} />
          </section>
        )}

        {/* ── MANUAL FILTERS TOGGLE ── */}
        {showManualFilters && (
          <section className="mb-6" aria-label="Manual Filters">
            <ManualFilters />
          </section>
        )}

        {/* ── 2. RESULTS TOOLBAR ── */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-foreground">
                {resultCount} hospital{resultCount !== 1 ? "s" : ""} match your search
              </p>
              {locationLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  <MapPin className="w-3 h-3" />
                  Near {locationLabel.split(",")[0]}
                </span>
              )}
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
        ) : failure ? (
          <LoadErrorState
            title="Something went wrong loading results"
            failure={failure}
            onRetry={fetchHospitals}
          />
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
        <div className="min-h-screen flex flex-col bg-transparent font-sans">
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
