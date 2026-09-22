"use client";

import { useMemo, Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GitCompare,
  CheckCircle2,
  Minus,
  ExternalLink,
  MapPin,
  IndianRupee,
  BedDouble,
  Activity,
  SearchX,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { Hospital } from "@/lib/mockHospitals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCost = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Returns index of the "best" value in an array (lowest or highest). */
function bestIndex(values: (number | null)[], prefer: "low" | "high"): number {
  const valid = values
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v !== null) as { v: number; i: number }[];
  if (valid.length === 0) return -1;
  return valid.reduce((best, cur) =>
    prefer === "low" ? (cur.v < best.v ? cur : best) : cur.v > best.v ? cur : best
  ).i;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single metric row in the desktop table */
function TableRow({
  label,
  cells,
  highlightIdx = -1,
  muted = false,
}: {
  label: string;
  cells: React.ReactNode[];
  highlightIdx?: number;
  muted?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-xs font-semibold text-muted uppercase tracking-wider align-top w-36 whitespace-nowrap">
        {label}
      </td>
      {cells.map((cell, i) => (
        <td
          key={i}
          className={`py-3 px-4 text-sm align-top ${
            i === highlightIdx ? "bg-success/8 rounded-lg" : ""
          } ${muted ? "text-muted" : "text-foreground"}`}
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}

/** Facility check/dash cell */
function FacilityCell({ has, facility }: { has: boolean; facility: string }) {
  const Icon = FACILITY_ICONS[facility] ?? Activity;
  return has ? (
    <span className="inline-flex items-center gap-1.5 text-success font-medium">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      {facility}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <Minus className="w-4 h-4 flex-shrink-0" />
      <span className="line-through opacity-50">{facility}</span>
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCompare() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
          <GitCompare className="w-8 h-8 text-muted" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Select hospitals to compare
        </h1>
        <p className="text-sm text-muted max-w-sm mb-6">
          Use the &ldquo;Add to Compare&rdquo; buttons on the results page to select
          2–3 hospitals, then click &ldquo;Compare Now&rdquo; to see them side by side.
        </p>
        <Link
          href="/search"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>
      </main>
      <Footer />
    </div>
  );
}

// ─── Mobile: stacked cards per hospital ───────────────────────────────────────
function MobileCard({
  hospital,
  allFacilities,
  rank,
}: {
  hospital: Hospital;
  allFacilities: string[];
  rank: { cost: boolean; volume: boolean; icu: boolean };
}) {
  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          <VerificationBadge
            status={hospital.verificationStatus}
            lastVerified={hospital.lastVerified}
          />
        </div>
        <h3 className="text-base font-bold text-foreground leading-snug">
          {hospital.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-sm text-muted">
          <MapPin className="w-3.5 h-3.5" />
          {hospital.city}
        </div>
      </div>

      {/* Metrics */}
      <dl className="space-y-3 text-sm">
        <MetricRow
          label="Indicative cost"
          value={`${formatCost(hospital.costMin)} – ${formatCost(hospital.costMax)}`}
          highlight={rank.cost}
          note="lowest min"
        />
        <MetricRow
          label="Specialty"
          value={hospital.specialties[0] ?? "General"}
        />
        <MetricRow
          label="Procedures/year"
          value={`${hospital.annualProcedureVolume.toLocaleString("en-IN")} (reported)`}
          highlight={rank.volume}
          note="highest"
        />
        <MetricRow
          label="Accreditation"
          value={
            hospital.accreditation.length > 0
              ? hospital.accreditation.join(", ")
              : "—"
          }
        />
        <MetricRow
          label="PM-JAY"
          value={hospital.pmjayEmpanelled ? "Empanelled ✓" : "Not empanelled"}
          successColor={hospital.pmjayEmpanelled}
        />
        <MetricRow
          label="ICU beds"
          value={`${hospital.icuBeds} (indicative)`}
          highlight={rank.icu}
          note="most"
        />
        <MetricRow
          label="Source"
          value={hospital.sourceType}
          muted
        />
      </dl>

      {/* Facilities */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Facilities
        </p>
        <div className="flex flex-wrap gap-2">
          {allFacilities.map((f) => {
            const has = hospital.facilities.includes(f);
            const Icon = FACILITY_ICONS[f] ?? Activity;
            return (
              <span
                key={f}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  has
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-slate-50 text-slate-300 border-slate-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                {f}
              </span>
            );
          })}
        </div>
      </div>

      <Link
        href={`/hospital/${hospital.hospitalId}`}
        className="btn-secondary inline-flex items-center gap-2 text-sm w-full justify-center"
      >
        View Full Details
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight = false,
  note,
  muted = false,
  successColor = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  note?: string;
  muted?: boolean;
  successColor?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 py-2 border-b border-slate-50 last:border-0 ${highlight ? "rounded-lg bg-success/8 px-2 -mx-2" : ""}`}>
      <dt className="text-xs font-semibold text-muted uppercase tracking-wider flex-shrink-0 pt-0.5">
        {label}
        {highlight && note && (
          <span className="ml-1 text-success normal-case tracking-normal font-medium">
            ({note})
          </span>
        )}
      </dt>
      <dd className={`text-sm text-right font-medium ${successColor ? "text-success" : muted ? "text-muted" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ComparePageInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const ids = useMemo(
    () =>
      idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3),
    [idsParam]
  );

  // Fetch each hospital in parallel from the real API
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length < 2) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    Promise.all(
      ids.map((id) =>
        fetch(`/api/hospitals/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d ? (d.hospital as Hospital) : null))
      )
    )
      .then((results) => {
        setHospitals(results.filter((h): h is Hospital => h !== null));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [ids]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-muted text-sm">Loading comparison…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="card p-8 text-center space-y-3 max-w-sm">
            <p className="font-semibold text-foreground">Couldn&apos;t load hospitals</p>
            <p className="text-sm text-muted">{error}</p>
            <Link href="/search" className="btn-primary inline-block">← Back to results</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Need at least 2 resolved hospitals for a meaningful comparison
  if (hospitals.length < 2) return <EmptyCompare />;

  // ─── Compute best-value indices for numeric rows ───────────────────────────
  const costBest = bestIndex(hospitals.map((h) => h.costMin), "low");
  const volumeBest = bestIndex(hospitals.map((h) => h.annualProcedureVolume), "high");
  const icuBest = bestIndex(hospitals.map((h) => h.icuBeds), "high");

  // Union of all facilities across compared hospitals
  const allFacilities = Array.from(
    new Set(hospitals.flatMap((h) => h.facilities))
  ).sort();

  const n = hospitals.length;

  // Column width class for the table
  const colClass = n === 2 ? "w-1/2" : "w-1/3";

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back link + heading */}
        <div className="mb-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to results
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Comparing {n} Hospital{n > 1 ? "s" : ""}
          </h1>
        </div>

        {/* Disclaimer caption */}
        <p className="text-xs text-muted mb-6 max-w-2xl bg-white border border-border rounded-xl px-4 py-3">
          <strong className="text-slate-600">Note:</strong> Highlighted values
          show the strongest option for that specific metric — not an overall
          recommendation. Review all factors together before making a decision.
          Cost figures are indicative; procedure volumes are reported data and
          may not be independently verified.
        </p>

        {/* ── DESKTOP TABLE (md+) ── */}
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Column headers */}
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 pr-4 pl-5 text-xs font-semibold text-muted uppercase tracking-wider w-36">
                    Metric
                  </th>
                  {hospitals.map((h, i) => (
                    <th
                      key={h.hospitalId}
                      className={`py-4 px-4 text-left align-top ${colClass} ${
                        i < n - 1 ? "border-r border-border" : ""
                      }`}
                    >
                      <div className="mb-2">
                        <VerificationBadge
                          status={h.verificationStatus}
                          lastVerified={h.lastVerified}
                        />
                      </div>
                      <div className="font-bold text-foreground text-sm leading-snug mb-1">
                        {h.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="w-3 h-3" />
                        {h.city}
                      </div>
                      <Link
                        href={`/hospital/${h.hospitalId}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-semibold hover:underline"
                      >
                        View Full Details
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {/* Cost */}
                <TableRow
                  label="Indicative cost"
                  highlightIdx={costBest}
                  cells={hospitals.map((h, i) => (
                    <div key={i}>
                      <p className={`font-bold ${i === costBest ? "text-success" : ""}`}>
                        {formatCost(h.costMin)} – {formatCost(h.costMax)}
                        {i === costBest && (
                          <span className="ml-1 text-xs font-medium text-success/70">(lowest)</span>
                        )}
                      </p>
                    </div>
                  ))}
                />

                {/* Specialty */}
                <TableRow
                  label="Specialty"
                  cells={hospitals.map((h) => (
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {h.specialties[0] ?? "General"}
                    </span>
                  ))}
                />

                {/* Volume */}
                <TableRow
                  label="Procedures/year"
                  highlightIdx={volumeBest}
                  cells={hospitals.map((h, i) => (
                    <span key={i} className={i === volumeBest ? "text-success font-semibold" : ""}>
                      {h.annualProcedureVolume.toLocaleString("en-IN")}
                      <span className="text-xs text-muted font-normal ml-1">(reported)</span>
                      {i === volumeBest && (
                        <span className="ml-1 text-xs font-medium text-success/70">(highest)</span>
                      )}
                    </span>
                  ))}
                />

                {/* Accreditation */}
                <TableRow
                  label="Accreditation"
                  cells={hospitals.map((h) =>
                    h.accreditation.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {h.accreditation.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )
                  )}
                />

                {/* Facilities — one row per facility in the union set */}
                {allFacilities.map((facility) => (
                  <TableRow
                    key={facility}
                    label={facility}
                    cells={hospitals.map((h) => (
                      <FacilityCell
                        key={h.hospitalId}
                        has={h.facilities.includes(facility)}
                        facility={facility}
                      />
                    ))}
                  />
                ))}

                {/* PM-JAY */}
                <TableRow
                  label="PM-JAY"
                  cells={hospitals.map((h) =>
                    h.pmjayEmpanelled ? (
                      <span className="inline-flex items-center gap-1 text-success font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Empanelled
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Not empanelled</span>
                    )
                  )}
                />

                {/* ICU beds */}
                <TableRow
                  label="ICU beds"
                  highlightIdx={icuBest}
                  cells={hospitals.map((h, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 ${i === icuBest ? "text-success font-semibold" : ""}`}
                    >
                      <BedDouble className="w-3.5 h-3.5 text-primary" />
                      {h.icuBeds}
                      <span className="text-xs text-muted font-normal">(indicative)</span>
                      {i === icuBest && (
                        <span className="text-xs font-medium text-success/70">(most)</span>
                      )}
                    </span>
                  ))}
                />

                {/* Verification / Source */}
                <TableRow
                  label="Data source"
                  muted
                  cells={hospitals.map((h) => (
                    <div key={h.hospitalId} className="space-y-1">
                      <VerificationBadge
                        status={h.verificationStatus}
                        lastVerified={h.lastVerified}
                      />
                      <p className="text-xs text-muted capitalize">{h.sourceType} source</p>
                    </div>
                  ))}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MOBILE: stacked cards per hospital ── */}
        <div className="md:hidden space-y-6">
          {hospitals.map((h, i) => (
            <div key={h.hospitalId}>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Hospital {i + 1} of {n}
              </p>
              <MobileCard
                hospital={h}
                allFacilities={allFacilities}
                rank={{
                  cost: i === costBest,
                  volume: i === volumeBest,
                  icu: i === icuBest,
                }}
              />
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}// Suspense wrapper is required because useSearchParams() opts the page into
// client-side rendering and Next.js needs a boundary to handle the build step.
export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-muted text-sm">Loading comparison…</p>
        </main>
        <Footer />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
