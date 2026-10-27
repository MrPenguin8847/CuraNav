"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { describeError, type LoadFailure, type LoadStatus } from "@/lib/loadState";

export interface PlatformStats {
  totalHospitals: number;
  totalSpecialties: number;
  specialties: string[];
  totalCities: number;
  cities: string[];
  pmjayEmpanelled: number;
  withCostData: number;
  withAccreditation: number;
  verifiedCount: number;
  withOutcomes: number;
  /**
   * How many searchable hospitals list each canonical specialty. Drives the
   * homepage cards so counts come from the database instead of being
   * hardcoded in copy that silently goes stale.
   */
  specialtyCounts: Record<string, number>;
  /**
   * Row count per `verification_status`. The live vocabulary is
   * `verified` / `pending` / `simulated`, so the UI can say how much of the
   * index is human-verified instead of implying all of it is.
   */
  statusCounts?: Record<string, number>;
  lastUpdated: string;
}

const FALLBACK_STATS: PlatformStats = {
  totalHospitals: 0,
  totalSpecialties: 0,
  specialties: [],
  totalCities: 0,
  cities: [],
  pmjayEmpanelled: 0,
  withCostData: 0,
  withAccreditation: 0,
  verifiedCount: 0,
  withOutcomes: 0,
  specialtyCounts: {},
  statusCounts: {},
  lastUpdated: new Date().toISOString(),
};

const STATS_TIMEOUT_MS = 8_000;

let cachedStats: PlatformStats | null = null;
let fetchPromise: Promise<PlatformStats> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Hook that fetches live platform stats from /api/stats.
 *
 * Behaviour that matters: the request is bounded. Previously it was a bare
 * `fetch`, so if `/api/stats` never responded the promise never settled,
 * `loading` stayed true forever and the stat strip skeleton never resolved into
 * either numbers or an error. It now fails into an explicit `error` state that
 * exposes `retry()`.
 */
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(cachedStats || FALLBACK_STATS);
  const [status, setStatus] = useState<LoadStatus>(cachedStats ? "success" : "loading");
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      // Serve a fresh cache without touching the network.
      if (cachedStats && Date.now() - lastFetchTime < CACHE_TTL) {
        if (!cancelled) {
          setStats(cachedStats);
          setFailure(null);
          setStatus("success");
        }
        return;
      }

      // Deduplicate simultaneous requests across components on the page.
      if (!fetchPromise) {
        fetchPromise = fetchWithTimeout("/api/stats", { cache: "no-store" }, STATS_TIMEOUT_MS)
          .then(async (res) => {
            if (!res.ok) throw new Error(`The statistics service returned an error (${res.status}).`);
            const data = (await res.json()) as Partial<PlatformStats>;
            // Tolerate an older cached response shape instead of rendering NaN.
            const merged: PlatformStats = { ...FALLBACK_STATS, ...data, lastUpdated: data.lastUpdated ?? new Date().toISOString() };
            merged.specialtyCounts = data.specialtyCounts ?? {};
            cachedStats = merged;
            lastFetchTime = Date.now();
            return merged;
          })
          .finally(() => {
            fetchPromise = null;
          });
      }

      if (!cancelled) {
        setStatus("loading");
        setFailure(null);
      }

      try {
        const data = await fetchPromise;
        if (!cancelled) {
          setStats(data);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          // Keep any previously cached values on screen: stale numbers labelled
          // as stale are better than replacing real data with a blank error.
          setFailure(describeError(err, "We could not load live platform statistics."));
          setStatus("error");
        }
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const retry = useCallback(() => {
    // A retry is an explicit user action, so it must bypass the cache.
    cachedStats = null;
    lastFetchTime = 0;
    setNonce((n) => n + 1);
  }, []);

  return {
    stats,
    status,
    /** Convenience flag for consumers that only need a spinner. */
    loading: status === "loading",
    /** User-safe message, or `null` while healthy. */
    error: failure?.message ?? null,
    failure,
    retry,
  };
}
