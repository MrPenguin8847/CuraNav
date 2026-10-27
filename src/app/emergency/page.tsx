"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmergencyHospitalCard } from "@/components/EmergencyHospitalCard";
import { LoadErrorState } from "@/components/LoadErrorState";
import { Hospital } from "@/lib/mockHospitals";
import { getStoredLocation, storeLocation } from "@/lib/userLocation";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { describeError, type LoadFailure, type LoadStatus } from "@/lib/loadState";
import { getPositionWithDeadline } from "@/lib/geolocation";
import { EMERGENCY_SPECIALTIES } from "@/lib/specialties";
import {
  Siren,
  Loader2,
  MapPin,
  Phone,
  Ambulance,
  Info,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

type LocationState = {
  lat: number;
  lon: number;
  label: string | null;
} | null;

const HOSPITALS_TIMEOUT_MS = 12_000;

/**
 * How long we wait for the browser's location permission prompt before giving up
 * and asking for a city instead.
 *
 * This has to be enforced by us, not by the `timeout` option passed to
 * `getCurrentPosition`: that option only bounds the time spent *acquiring* a
 * fix. While the permission dialog is open the callback has simply not fired
 * yet, so the page sat on "Finding the nearest emergency care…" indefinitely.
 */
const GEOLOCATION_PROMPT_TIMEOUT_MS = 8_000;

function EmergencyPageContent() {
  const searchParams = useSearchParams();
  const fromTriage = searchParams.get("from") === "triage";

  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<LocationState>(null);
  const [cityInput, setCityInput] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [askedForLocation, setAskedForLocation] = useState(false);

  const isLoading = status === "loading";

  const fetchHospitals = useCallback(
    async (coords: { lat: number; lon: number } | null, city?: string | null) => {
      setStatus("loading");
      setFailure(null);
      setUsedFallback(false);
      try {
        const params = new URLSearchParams();
        // The verified emergency-capable values. This list used to contain
        // "Emergency Stabilization", which does not exist in the dataset, and
        // omitted "Emergency Room Packages", which covers 25 approved hospitals.
        // Because the invalid value made the whole string unresolvable, the
        // specialty filter was silently dropped and this page listed arbitrary
        // hospitals rather than emergency-capable ones.
        params.set("specialty", EMERGENCY_SPECIALTIES.join(","));
        params.set("radius_km", "120");
        params.set("sort", "distance");

        if (coords) {
          params.set("lat", coords.lat.toString());
          params.set("lon", coords.lon.toString());
        } else if (city?.trim()) {
          params.set("city", city.trim());
        }

        let res = await fetchWithTimeout(`/api/hospitals?${params.toString()}`, {}, HOSPITALS_TIMEOUT_MS);
        if (!res.ok) throw new Error(`The hospitals service returned an error (${res.status}).`);
        let data = (await res.json()) as { hospitals: Hospital[] };

        // If a coordinate/city-based search finds nothing (hospitals without
        // recorded lat/long are filtered out), fall back to listing all
        // emergency-capable hospitals.
        if (data.hospitals.length === 0 && (coords || city?.trim())) {
          const fallbackParams = new URLSearchParams();
          fallbackParams.set("specialty", EMERGENCY_SPECIALTIES.join(","));
          res = await fetchWithTimeout(
            `/api/hospitals?${fallbackParams.toString()}`,
            {},
            HOSPITALS_TIMEOUT_MS
          );
          if (res.ok) {
            data = (await res.json()) as { hospitals: Hospital[] };
            if (data.hospitals.length > 0) setUsedFallback(true);
          }
        }

        setHospitals(data.hospitals.slice(0, 3));
        setStatus("success");
      } catch (err) {
        setFailure(describeError(err, "Something went wrong finding emergency care."));
        setStatus("error");
      }
    },
    []
  );


  // Initial load: prefer saved location, otherwise ask for geolocation.
  useEffect(() => {
    const saved = getStoredLocation();
    if (saved) {
      setLocation({ lat: saved.lat, lon: saved.lon, label: saved.label });
      fetchHospitals({ lat: saved.lat, lon: saved.lon });
      return;
    }

    if (!navigator.geolocation) {
      setAskedForLocation(true);
      setStatus("success");
      return;
    }

    setLocating(true);
    // Our own deadline on the permission prompt: a user who leaves the dialog
    // open must not be stranded on a spinner, and the city form is a better
    // fallback. `getPositionWithDeadline` enforces this for us.
    getPositionWithDeadline(GEOLOCATION_PROMPT_TIMEOUT_MS, 10_000)
      .then(async ({ lat: latitude, lon: longitude }) => {
        let label: string | null = null;
        try {
          // Reverse geocoding is a nice-to-have: a slow or unreachable
          // Nominatim must not hold up the results.
          const res = await fetchWithTimeout(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "CuraNav/1.0" } },
            3_000
          );
          const data = await res.json();
          label =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            null;
          const state = data.address?.state ?? "";
          storeLocation({ lat: latitude, lon: longitude, label: [label, state].filter(Boolean).join(", ") });
        } catch {
          storeLocation({ lat: latitude, lon: longitude, label: "Your location" });
        }
        setLocation({ lat: latitude, lon: longitude, label });
        setLocating(false);
        fetchHospitals({ lat: latitude, lon: longitude });
      })
      .catch(() => {
        setLocating(false);
        setAskedForLocation(true);
        setStatus("success");
      });
  }, [fetchHospitals]);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setLocation(null);
    fetchHospitals(null, cityInput);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans">
      <Header />

        <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* ── Arrived from the symptom checker ── */}
          {fromTriage && (
            <section className="mb-6 rounded-2xl border border-error/30 bg-error/5 p-4 flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-foreground font-semibold">
                  Your symptom check flagged signs that need immediate care.
                </p>
                <p className="text-muted-foreground mt-1">
                  Please do not wait for an appointment. Call an ambulance or
                  go to the nearest emergency department now.
                </p>
              </div>
            </section>
          )}

          {/* ── Urgent banner: call a helpline first ── */}
        <section className="mb-8 rounded-3xl bg-gradient-to-br from-error/15 to-error/5 border border-error/20 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-error/20 flex items-center justify-center">
                <Siren className="w-6 h-6 text-error" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Medical Emergency
                </h1>
                <p className="text-sm text-muted-foreground">
                  Nearest emergency-capable hospitals to you
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-error font-extrabold rounded-xl hover:bg-white/90 transition-colors text-base sm:text-lg"
              >
                <Phone className="w-5 h-5" />
                112
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-error text-white font-extrabold rounded-xl hover:bg-error/90 transition-colors text-base sm:text-lg shadow-lg shadow-error/30"
              >
                <Ambulance className="w-5 h-5" />
                108
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              National emergency &amp; ambulance helplines — call first in a
              time-critical situation.
            </p>
          </div>
        </section>

        {/* ── Location status ── */}
        <section className="mb-6">
          {locating || isLoading ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Finding the nearest emergency care…
            </p>
          ) : location?.label ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              Searching near <strong className="text-foreground">{location.label}</strong>
            </p>
          ) : askedForLocation || usedFallback ? (
            <div className="rounded-2xl glass border border-white/10 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {usedFallback
                  ? "Some hospitals don't have precise coordinates yet, so exact distance ranking is limited. Enter your city below to narrow them down, or call 108 for an ambulance."
                  : "We couldn't get your location. Enter your city to find nearby emergency hospitals, or call 108 for an ambulance."}
              </p>
            </div>
          ) : null}
        </section>

        {/* ── Manual city fallback ── */}
        {(askedForLocation || usedFallback) && (
          <form onSubmit={handleCitySubmit} className="mb-8 flex gap-3">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter your city, e.g. Chandigarh"
              className="flex-1 px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={!cityInput.trim() || isLoading}
              className="btn-primary text-sm px-5 py-3 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Find nearby"
              )}
            </button>
          </form>
        )}

        {/* ── Results ── */}
        {failure ? (
          <LoadErrorState
            title="Something went wrong finding emergency care"
            failure={failure}
            onRetry={() => fetchHospitals(location ? { lat: location.lat, lon: location.lon } : null, location?.label)}
            showEmergencyNumbers
          />
        ) : isLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-white/10 mb-3" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
                <div className="h-10 mt-4 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="card p-8 text-center space-y-3">
            <Siren className="w-10 h-10 text-error mx-auto" />
            <p className="text-foreground font-semibold">No nearby hospitals found.</p>
            <p className="text-sm text-muted-foreground">
              Please call{" "}
              <a href="tel:108" className="font-bold text-error">108</a> or{" "}
              <a href="tel:112" className="font-bold text-error">112</a> for emergency
              assistance.
            </p>
          </div>
        ) : (
          <section className="space-y-4" aria-label="Nearest emergency hospitals">
            {hospitals.map((hospital, index) => (
              <EmergencyHospitalCard key={hospital.hospitalId} hospital={hospital} rank={index + 1} />
            ))}
          </section>
        )}

        {/* ── Disclaimer ── */}
        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              CuraNav helps you locate hospitals but does not dispatch ambulances
              or guarantee bed availability. Availability, timings and
              eligibility must be confirmed directly with the hospital by phone.
              In a time-critical emergency, call <strong className="text-foreground">108</strong>{" "}
              (ambulance) or <strong className="text-foreground">112</strong> (national
              emergency) immediately.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-transparent font-sans">
          <Header />
          <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading emergency options…
            </p>
          </main>
          <Footer />
        </div>
      }
    >
      <EmergencyPageContent />
    </Suspense>
  );
}
