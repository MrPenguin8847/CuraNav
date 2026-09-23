"use client";

import { useState, useEffect } from "react";

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
  lastUpdated: new Date().toISOString(),
};

let cachedStats: PlatformStats | null = null;
let fetchPromise: Promise<PlatformStats> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Hook that fetches live platform stats from /api/stats.
 * Automatically deduplicates simultaneous requests and caches for 30s.
 */
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(cachedStats || FALLBACK_STATS);
  const [loading, setLoading] = useState(!cachedStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      // If we have a fresh cache, use it immediately and exit
      if (cachedStats && Date.now() - lastFetchTime < CACHE_TTL) {
        if (!cancelled) {
          setStats(cachedStats);
          setLoading(false);
        }
        return;
      }

      // If a fetch is already in flight, wait for it
      if (!fetchPromise) {
        fetchPromise = fetch("/api/stats", { cache: "no-store" })
          .then(async (res) => {
            if (!res.ok) throw new Error(`Stats API returned ${res.status}`);
            const data = await res.json();
            cachedStats = data;
            lastFetchTime = Date.now();
            return data;
          })
          .finally(() => {
            fetchPromise = null;
          });
      }

      try {
        const data = await fetchPromise;
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[usePlatformStats]", err);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
