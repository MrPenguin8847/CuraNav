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

/**
 * Hook that fetches live platform stats from /api/stats.
 * All homepage components consume this so stats update in real-time
 * as the database changes.
 */
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Stats API returned ${res.status}`);
        const data = await res.json();
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
