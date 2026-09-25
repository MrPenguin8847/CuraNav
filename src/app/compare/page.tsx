"use client";

import { useMemo, Suspense, useState, useEffect, useCallback } from "react";
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
  Sparkles,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { Hospital } from "@/lib/mockHospitals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lightweight markdown → styled HTML for the AI summary. */
function renderMarkdown(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let html = escaped
    // Headings — styled with colors and icons
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:0.85rem;font-weight:700;color:#94a3b8;margin:1rem 0 0.5rem;padding-left:0.5rem;border-left:3px solid #6366f1">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;color:#e2e8f0;margin:1.25rem 0 0.5rem;padding:0.5rem 0.75rem;background:rgba(99,102,241,0.1);border-radius:0.5rem;border-left:4px solid #6366f1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.05rem;font-weight:800;color:#f1f5f9;margin:1.5rem 0 0.75rem;padding:0.6rem 0.75rem;background:rgba(79,70,229,0.15);border-radius:0.5rem;border-left:4px solid #4f46e5">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.15rem;font-weight:800;color:#f1f5f9;margin:0 0 0.75rem">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#94a3b8">$1</em>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1rem 0"/>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li style="padding:0.3rem 0;font-size:0.85rem;color:#cbd5e1;line-height:1.6">$1</li>')
    // Numbered list items  
    .replace(/^\d+\.\s+(.+)$/gm, '<li style="padding:0.3rem 0;font-size:0.85rem;color:#cbd5e1;line-height:1.6;list-style-type:decimal">$1</li>')
    // Table rows
    .replace(/^\|(.+)\|$/gm, (_, row: string) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return "<tr>" + cells.map((c: string) => `<td style="padding:0.5rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.07);font-size:0.8rem;color:#cbd5e1">${c}</td>`).join("") + "</tr>";
    })
    // Separator rows (|---|---|)
    .replace(/<tr><td[^>]*>[-:\s]+<\/td>.*?<\/tr>/g, "");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, '<ul style="list-style:none;padding:0;margin:0.5rem 0;background:rgba(255,255,255,0.03);border-radius:0.5rem;padding:0.5rem 0.75rem;border:1px solid rgba(255,255,255,0.08)">$1</ul>');

  // Wrap consecutive <tr> in <table>
  html = html.replace(/((?:<tr>.*?<\/tr>\s*)+)/g, (match) => {
    // Make first row a header
    const styled = match.replace(/<tr>(.*?)<\/tr>/, (m, inner) => {
      return '<thead><tr>' + inner.replace(/<td/g, '<th').replace(/<\/td>/g, '</th>') + '</tr></thead>';
    });
    return `<div style="overflow-x:auto;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.1);margin:0.75rem 0"><table style="width:100%;border-collapse:collapse;font-size:0.8rem">${styled}</table></div>`;
  });

  // Style th elements
  html = html.replace(/<th/g, '<th style="padding:0.6rem 0.75rem;background:rgba(99,102,241,0.15);font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;border-bottom:2px solid rgba(99,102,241,0.3);text-align:left"');

  // Convert remaining double newlines to paragraph breaks
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = `<p>${html}</p>`;
  // Clean up empty paragraphs and fix nesting
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>\s*(<h[1-4])/g, "$1");
  html = html.replace(/(<\/h[1-4]>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<ul)/g, "$1");
  html = html.replace(/(<\/ul>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<div)/g, "$1");
  html = html.replace(/(<\/div>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<hr)/g, "$1");
  html = html.replace(/(\/>\s*)<\/p>/g, "$1");

  // Style paragraphs
  html = html.replace(/<p>/g, '<p style="font-size:0.85rem;line-height:1.7;color:#94a3b8;margin:0.5rem 0">');

  return html;
}

const formatCost = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : null;

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
      <td className="py-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider align-top w-36 whitespace-nowrap">
        {label}
      </td>
      {cells.map((cell, i) => (
        <td
          key={i}
          className={`py-3 px-4 text-sm align-top ${
            i === highlightIdx ? "bg-success/8 rounded-lg" : ""
          } ${muted ? "text-slate-400" : "text-foreground"}`}
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
    <span className="inline-flex items-center gap-1.5 text-slate-400">
      <Minus className="w-4 h-4 flex-shrink-0" />
      <span className="line-through opacity-50">{facility}</span>
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCompare() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-background/50 border border-white/10 flex items-center justify-center mb-5">
          <GitCompare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Select hospitals to compare
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
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
        <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          {hospital.city ?? hospital.address ?? "India"}
        </div>
      </div>

      {/* Metrics */}
      <dl className="space-y-3 text-sm">
        <MetricRow
          label="Indicative cost"
          value={hospital.costMin != null && hospital.costMax != null ? `${formatCost(hospital.costMin)} – ${formatCost(hospital.costMax)}` : "N/A"}
          highlight={rank.cost}
          note="lowest min"
        />
        <MetricRow
          label="Specialty"
          value={hospital.specialties[0] ?? "General"}
        />
        <MetricRow
          label="Procedures/year"
          value={hospital.annualProcedureVolume != null ? `${hospital.annualProcedureVolume.toLocaleString("en-IN")} (reported)` : "N/A"}
          highlight={rank.volume}
          note="highest"
        />
        <MetricRow
          label="Outcomes"
          value={hospital.outcomeMetric ? hospital.outcomeMetric : "N/A"}
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
          value={hospital.icuBeds != null ? `${hospital.icuBeds} (indicative)` : "N/A"}
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
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                    : "bg-background text-muted-foreground border-white/10"
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
    <div className={`flex justify-between gap-4 py-2 border-b border-white/5 last:border-0 ${highlight ? "rounded-lg bg-success/8 px-2 -mx-2" : ""}`}>
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 pt-0.5">
        {label}
        {highlight && note && (
          <span className="ml-1 text-success normal-case tracking-normal font-medium">
            ({note})
          </span>
        )}
      </dt>
      <dd className={`text-sm text-right font-medium ${successColor ? "text-success" : muted ? "text-slate-400" : "text-foreground"}`}>
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
        .slice(0, 5),
    [idsParam]
  );

  // Fetch each hospital in parallel from the real API
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── AI Comparison state ──────────────────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const generateAiSummary = useCallback(async () => {
    if (hospitals.length < 2) return;
    setAiLoading(true);
    setAiError(null);
    setAiSummary(null);
    try {
      const res = await fetch("/api/compare/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: hospitals.map((h) => h.hospitalId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI comparison failed");
      setAiSummary(data.comparison);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }, [hospitals]);

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
      <div className="min-h-screen flex flex-col bg-transparent font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading comparison…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="card p-8 text-center space-y-3 max-w-sm">
            <p className="font-semibold text-foreground">Couldn&apos;t load hospitals</p>
            <p className="text-sm text-slate-400">{error}</p>
            <Link href="/search" className="btn-primary inline-block">← Back to results</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Removed AI Comparison state (moved to top)

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
  const colClass = n === 2 ? "w-1/2" : n === 3 ? "w-1/3" : n === 4 ? "w-1/4" : "w-1/5";

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back link + heading */}
        <div className="mb-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to results
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Comparing {n} Hospital{n > 1 ? "s" : ""}
          </h1>
        </div>

        {/* ── AI COMPARISON SECTION ── */}
        <div className="mb-6">
          {!aiSummary && !aiLoading && (
            <button
              onClick={generateAiSummary}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl px-6 py-3 text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/25"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Comparison Summary
            </button>
          )}

          {aiLoading && (
            <div className="card p-6 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-foreground">AI is analyzing your hospitals…</p>
                  <p className="text-xs text-slate-400">This may take a few seconds</p>
                </div>
              </div>
            </div>
          )}

          {aiError && (
            <div className="card p-5 border-2 border-warning/30 bg-warning/5">
              <p className="text-sm text-warning font-medium mb-2">⚠️ {aiError}</p>
              <button
                onClick={generateAiSummary}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {aiSummary && (
            <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-lg shadow-indigo-100/30">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">AI Comparison Summary</h2>
                    <p className="text-xs text-indigo-100">Powered by AI · Not a medical recommendation</p>
                  </div>
                </div>
                <button
                  onClick={generateAiSummary}
                  className="text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ↻ Regenerate
                </button>
              </div>
              {/* Body */}
              <div className="bg-background/50 px-6 py-5">
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(aiSummary) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer caption */}
        <p className="text-xs text-muted-foreground mb-6 max-w-2xl bg-background/50 border border-white/10 rounded-xl px-4 py-3">
          <strong className="text-foreground">Note:</strong> Highlighted values
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
                  <th className="text-left py-4 pr-4 pl-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-36">
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
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {h.city ?? h.address ?? "India"}
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
                {/* ── KEY PERFORMANCE DASHBOARD METRICS ── */}
                
                {/* 1. Procedures/year */}
                <TableRow
                  label="Patient Volumes"
                  highlightIdx={volumeBest}
                  cells={hospitals.map((h, i) => (
                    <span key={i} className={i === volumeBest && h.annualProcedureVolume != null ? "text-success font-semibold" : ""}>
                      {h.annualProcedureVolume != null ? `${h.annualProcedureVolume.toLocaleString("en-IN")} procedures/year` : "Data unavailable"}
                      {i === volumeBest && h.annualProcedureVolume != null && (
                        <span className="ml-1 text-xs font-medium text-success/70">(highest)</span>
                      )}
                    </span>
                  ))}
                />

                {/* 2. Outcomes */}
                <TableRow
                  label="Reported Outcomes"
                  cells={hospitals.map((h, i) => (
                    <span key={i} className="text-sm font-medium">
                      {h.outcomeMetric ? h.outcomeMetric : "Data unavailable"}
                    </span>
                  ))}
                />

                {/* 3. Cost */}
                <TableRow
                  label="Average Costs"
                  highlightIdx={costBest}
                  cells={hospitals.map((h, i) => (
                    <div key={i} className="space-y-1.5">
                      {/* Private Cost */}
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Private</span>
                        {h.costMin != null && h.costMax != null ? (
                          <>
                            <p className={`font-bold ${i === costBest ? "text-success" : "text-foreground"}`}>
                              {formatCost(h.costMin)} – {formatCost(h.costMax)}
                              {i === costBest && (
                                <span className="ml-1 text-xs font-medium text-success/70">(lowest)</span>
                              )}
                            </p>
                            <p className="text-xs text-primary font-semibold">
                              Avg: {formatCost(Math.round(((h.costMin ?? 0) + (h.costMax ?? 0)) / 2))}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-foreground">Contact for pricing</p>
                        )}
                      </div>

                      {/* PM-JAY Cost */}
                      {h.pmjayEmpanelled && (
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">PM-JAY (Govt)</span>
                          <span className="inline-flex items-center gap-1 text-success font-semibold text-xs bg-success/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Standard Rates (Free)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                />

                {/* 4. Verified Certifications (Accreditation + Verification Badge) */}
                <TableRow
                  label="Verified Certifications"
                  cells={hospitals.map((h) => (
                    <div key={h.hospitalId} className="space-y-2">
                      <VerificationBadge
                        status={h.verificationStatus}
                        lastVerified={h.lastVerified}
                      />
                      {h.accreditation.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {h.accreditation.map((a) => (
                            <span
                              key={a}
                              className="px-2 py-0.5 bg-background/50 text-muted-foreground text-xs font-semibold rounded-full border border-white/10"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No specific accreditations listed</span>
                      )}
                    </div>
                  ))}
                />

                {/* ── STANDARD COMPARISON DATA ── */}
                {/* Address */}
                <TableRow
                  label="Address"
                  cells={hospitals.map((h) => (
                    <div key={h.hospitalId} className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{h.address ?? "—"}</span>
                    </div>
                  ))}
                />

                {/* Phone */}
                <TableRow
                  label="Contact"
                  cells={hospitals.map((h) => (
                    <span key={h.hospitalId}>
                      {h.phone ? (
                        <a href={`tel:${h.phone}`} className="text-primary font-semibold text-sm hover:underline">
                          📞 {h.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">Not available</span>
                      )}
                    </span>
                  ))}
                />

                {/* All Specialties */}
                <TableRow
                  label="Specialties"
                  cells={hospitals.map((h) => (
                    <div key={h.hospitalId} className="flex flex-wrap gap-1">
                      {h.specialties.length > 0 ? h.specialties.map((s) => (
                        <span key={s} className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          {s}
                        </span>
                      )) : (
                        <span className="text-slate-400 text-xs">Not listed</span>
                      )}
                    </div>
                  ))}
                />

                {/* Facility Type */}
                <TableRow
                  label="Facility Type"
                  cells={hospitals.map((h) => (
                    <span key={h.hospitalId} className="text-sm font-medium">
                      {h.facilityType ?? "Hospital"}
                    </span>
                  ))}
                />

                {/* PM-JAY */}
                <TableRow
                  label="PM-JAY"
                  cells={hospitals.map((h) =>
                    h.pmjayEmpanelled ? (
                      <span key={h.hospitalId} className="inline-flex items-center gap-1 text-success font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Empanelled
                      </span>
                    ) : (
                      <span key={h.hospitalId} className="text-slate-400 text-xs">Not empanelled</span>
                    )
                  )}
                />





                {/* Facilities — one row per facility in the union set */}
                {allFacilities.length > 0 && allFacilities.map((facility) => (
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

                {/* ICU Beds — only if at least one has data */}
                {hospitals.some((h) => h.icuBeds != null) && (
                  <TableRow
                    label="ICU Beds"
                    highlightIdx={icuBest}
                    cells={hospitals.map((h, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 ${i === icuBest ? "text-success font-semibold" : ""}`}
                      >
                        <BedDouble className="w-3.5 h-3.5 text-primary" />
                        {h.icuBeds != null ? h.icuBeds : "—"}
                        {i === icuBest && (
                          <span className="text-xs font-medium text-success/70">(most)</span>
                        )}
                      </span>
                    ))}
                  />
                )}


              </tbody>
            </table>
          </div>
        </div>

        {/* ── MOBILE: stacked cards per hospital ── */}
        <div className="md:hidden space-y-6">
          {hospitals.map((h, i) => (
            <div key={h.hospitalId}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
      <div className="min-h-screen flex flex-col bg-transparent font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading comparison…</p>
        </main>
        <Footer />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
