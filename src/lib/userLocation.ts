/**
 * src/lib/userLocation.ts
 *
 * Persists the user's consented location in localStorage so it can be sent
 * with every search request (lat/lon) without re-prompting for permission.
 */

export interface StoredLocation {
  lat: number;
  lon: number;
  label: string;
  savedAt: string;
}

const STORAGE_KEY = "curanav:user-location";

export function storeLocation(loc: { lat: number; lon: number; label: string }): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredLocation = { ...loc, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode, storage full) — fail silently
  }
}

export function getStoredLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocation;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lon !== "number" ||
      !Number.isFinite(parsed.lat) ||
      !Number.isFinite(parsed.lon)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredLocation(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}