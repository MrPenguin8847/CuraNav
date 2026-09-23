"use client";

import Link from "next/link";
import {
  MapPin,
  IndianRupee,
  Activity,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Stethoscope,
  Navigation,
  Wallet,
  Award,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Hospital } from "@/lib/mockHospitals";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { VerificationBadge } from "./VerificationBadge";
import { getEstimatedCost } from "@/lib/costEstimator";

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */

export interface ActiveFilters {
  condition: string | null;
  specialty: string | null;
  city: string | null;
  radius_km: number | null;
  min_budget: number | null;
  max_budget: number | null;
  facilities: string | null;
  sort_by: string;
}

interface ExplainChip {
  icon: React.ReactNode;
  label: string;
  detail: string;
  color: "green" | "blue" | "amber" | "purple" | "slate";
}

interface HospitalCardProps {
  hospital: Hospital;
  isSelected: boolean;
  onToggleCompare: (id: string) => void;
  compareCount: number;
  activeFilters?: ActiveFilters;
  rankIndex?: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Colour map for chips
 * ──────────────────────────────────────────────────────────────────────── */

const CHIP_COLORS: Record<ExplainChip["color"], string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue:   "bg-sky-50 text-sky-700 border-sky-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  slate:  "bg-slate-50 text-slate-600 border-slate-200",
};

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────── */

export function HospitalCard({
  hospital,
  isSelected,
  onToggleCompare,
  compareCount,
  activeFilters,
  rankIndex,
}: HospitalCardProps) {
  const {
    hospitalId,
    name,
    city,
    address,
    latitude,
    longitude,
    specialties,
    costMin,
    costMax,
    facilities,
    accreditation,
    pmjayEmpanelled,
    annualProcedureVolume,
    verificationStatus,
    lastVerified,
    sourceType,
    distance_km,
    successRates,
  } = hospital;

  const mapUrl = latitude && longitude 
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ' ' + (address ?? ''))}`;

  const shownFacilities = facilities.slice(0, 4);
  const hiddenCount = facilities.length - shownFacilities.length;

  const formatCost = (n: number | null) =>
    n != null ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L` : null;

  const matchingSpecialty = specialties[0] ?? "General";

  const handleCompareClick = () => {
    if (!isSelected && compareCount >= 5) return;
    onToggleCompare(hospitalId);
  };

  const specialtyCost = getEstimatedCost(matchingSpecialty);
  const estimatedAvgCost = specialtyCost ? Math.round((specialtyCost.min + specialtyCost.max) / 2) : null;

  /* ──────────────────────────────────────────────────────────────────────────
   * DYNAMIC EXPLAINABILITY ENGINE
   *
   * Compares the hospital's data against the user's extracted search filters
   * to produce contextual, data-driven explanation chips.
   * ──────────────────────────────────────────────────────────────────────── */

  const explainChips: ExplainChip[] = [];

  if (activeFilters) {
    // 1) Disease / Specialty match
    const searchCond = activeFilters.condition;
    const searchSpec = activeFilters.specialty;
    
    if (searchCond || searchSpec) {
      let matchedSpec = specialties.find((s) => 
        (searchCond && s.toLowerCase().includes(searchCond.toLowerCase())) ||
        (searchSpec && s.toLowerCase().includes(searchSpec.toLowerCase()))
      );

      // If we still don't have a match (e.g. searchSpec is a comma separated string), try to match parts
      if (!matchedSpec && searchSpec) {
         const specList = searchSpec.split(',').map(s => s.trim().toLowerCase());
         matchedSpec = specialties.find(s => specList.some(ls => s.toLowerCase() === ls));
      }

      if (matchedSpec) {
        explainChips.push({
          icon: <Stethoscope className="w-3.5 h-3.5" />,
          label: "Specialty Match",
          detail: `Has ${matchedSpec}`,
          color: "green",
        });

        // Add success rate chip for the matched specialty
        if (successRates && successRates[matchedSpec]) {
          explainChips.push({
            icon: <TrendingUp className="w-3.5 h-3.5" />,
            label: "Success Rate",
            detail: `${successRates[matchedSpec]}% in ${matchedSpec}`,
            color: "purple",
          });
        }
      } else {
        // Partial / broad match
        explainChips.push({
          icon: <Stethoscope className="w-3.5 h-3.5" />,
          label: "Related",
          detail: `Offers ${matchingSpecialty}`,
          color: "slate",
        });
        
        // Show success rate for the matchingSpecialty if available
        if (successRates && successRates[matchingSpecialty]) {
          explainChips.push({
            icon: <TrendingUp className="w-3.5 h-3.5" />,
            label: "Success Rate",
            detail: `${successRates[matchingSpecialty]}% in ${matchingSpecialty}`,
            color: "purple",
          });
        }
      }
    }

    // 2) Location match
    if (activeFilters.city) {
      const cityLower = activeFilters.city.toLowerCase();
      const hospitalCity = (city ?? hospital.address ?? "").toLowerCase();
      if (hospitalCity.includes(cityLower)) {
        explainChips.push({
          icon: <MapPin className="w-3.5 h-3.5" />,
          label: "Location Match",
          detail: distance_km != null ? `${distance_km.toFixed(1)} km away in ${city}` : `In ${city}`,
          color: "blue",
        });
      } else if (distance_km != null) {
        explainChips.push({
          icon: <Navigation className="w-3.5 h-3.5" />,
          label: "Nearby",
          detail: `${distance_km.toFixed(1)} km from ${activeFilters.city}`,
          color: "blue",
        });
      }
    } else if (distance_km != null) {
      explainChips.push({
        icon: <Navigation className="w-3.5 h-3.5" />,
        label: "Distance",
        detail: `${distance_km.toFixed(1)} km away`,
        color: "blue",
      });
    }

    // 3) Budget match
    if (activeFilters.max_budget != null) {
      const budget = activeFilters.max_budget;
      if (costMin != null && costMin <= budget) {
        explainChips.push({
          icon: <Wallet className="w-3.5 h-3.5" />,
          label: "Within Budget",
          detail: `Starts at ${formatCost(costMin)} (budget: ${formatCost(budget)})`,
          color: "green",
        });
      } else if (costMin != null && costMin > budget) {
        explainChips.push({
          icon: <Wallet className="w-3.5 h-3.5" />,
          label: "Over Budget",
          detail: `Starts at ${formatCost(costMin)} (budget: ${formatCost(budget)})`,
          color: "amber",
        });
      } else if (pmjayEmpanelled) {
        explainChips.push({
          icon: <Wallet className="w-3.5 h-3.5" />,
          label: "Within Budget",
          detail: "PM-JAY – Free / Subsidized",
          color: "green",
        });
      }
    }

    // 4) Priority match (distance vs cost) — show for ALL results, not just #1
    if (activeFilters.sort_by === "cost") {
      if (rankIndex === 0) {
        explainChips.push({
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Most Affordable",
          detail: costMin != null ? `From ${formatCost(costMin)}` : "Lowest cost option",
          color: "green",
        });
      } else {
        explainChips.push({
          icon: <Wallet className="w-3.5 h-3.5" />,
          label: "Sorted by Cost",
          detail: costMin != null ? `From ${formatCost(costMin)}` : pmjayEmpanelled ? "PM-JAY – Free / Subsidized" : "Contact for pricing",
          color: "blue",
        });
      }
    } else if (activeFilters.sort_by === "distance") {
      if (rankIndex === 0 && distance_km != null) {
        explainChips.push({
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Closest",
          detail: `${distance_km.toFixed(1)} km away`,
          color: "green",
        });
      } else if (distance_km != null) {
        explainChips.push({
          icon: <Navigation className="w-3.5 h-3.5" />,
          label: "Sorted by Distance",
          detail: `${distance_km.toFixed(1)} km away`,
          color: "blue",
        });
      }
    }

    // 5) Accreditation & trust signals
    if (accreditation.length > 0) {
      explainChips.push({
        icon: <Award className="w-3.5 h-3.5" />,
        label: "Accredited",
        detail: accreditation.join(", "),
        color: "purple",
      });
    }

    // 6) PM-JAY — show when no explicit budget but hospital is empanelled
    if (pmjayEmpanelled && activeFilters.max_budget == null) {
      explainChips.push({
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: "PM-JAY",
        detail: "Free / Subsidized for beneficiaries",
        color: "green",
      });
    }
  } else {
    // Fallback: no active filters — show basic static reasons
    const fallbackReasons = [
      `Matches ${matchingSpecialty}`,
      distance_km != null ? `${distance_km.toFixed(1)} km away` : null,
      pmjayEmpanelled ? "PM-JAY empanelled" : null,
      accreditation.length > 0 ? `${accreditation[0]} accredited` : null,
    ].filter(Boolean) as string[];

    fallbackReasons.slice(0, 3).forEach((r) => {
      explainChips.push({
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: "",
        detail: r,
        color: "slate",
      });
    });

    // Show best available success rate even with no filters
    if (successRates) {
      const entries = Object.entries(successRates);
      if (entries.length > 0) {
        const [bestSpec, bestRate] = entries.reduce((best, curr) => curr[1] > best[1] ? curr : best);
        explainChips.push({
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Success Rate",
          detail: `${bestRate}% in ${bestSpec}`,
          color: "purple",
        });
      }
    }
  }

  // ── Ensure a success rate chip is always shown if data is available ──────
  // (handles cases where condition/specialty matched but successRates key didn't match exactly)
  const hasSuccessChip = explainChips.some(c => c.label === "Success Rate");
  if (!hasSuccessChip && successRates) {
    // Try to find a rate for any of the hospital's specialties
    const matchEntry = specialties
      .map(s => [s, successRates[s]] as [string, number])
      .find(([, rate]) => rate != null && rate > 0);
    if (matchEntry) {
      explainChips.push({
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        label: "Success Rate",
        detail: `${matchEntry[1]}% in ${matchEntry[0]}`,
        color: "purple",
      });
    } else {
      // Fallback: use any key in successRates
      const anyEntry = Object.entries(successRates).find(([, v]) => v > 0);
      if (anyEntry) {
        explainChips.push({
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Success Rate",
          detail: `${anyEntry[1]}% in ${anyEntry[0]}`,
          color: "purple",
        });
      }
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
   * Render
   * ──────────────────────────────────────────────────────────────────────── */

  const hasMeaningfulFilters = activeFilters && (
    activeFilters.condition ||
    activeFilters.specialty ||
    activeFilters.city ||
    activeFilters.min_budget != null ||
    activeFilters.max_budget != null ||
    activeFilters.facilities
  );
  const isTopResult = rankIndex === 0 && hasMeaningfulFilters;

  return (
    <article
      className={`card p-5 md:p-6 transition-all duration-200 relative ${
        isSelected
          ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30"
          : "hover:shadow-md"
      } ${isTopResult ? "ring-2 ring-primary/20 border-primary/30" : ""}`}
    >
      {/* Top Result badge */}
      {isTopResult && (
        <div className="absolute -top-3 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
          <Sparkles className="w-3 h-3" />
          Best Match
        </div>
      )}

      {/* Top row: Name + Verification badge */}
      <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 ${isTopResult ? "mt-2" : ""}`}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {matchingSpecialty}
            </span>
            {pmjayEmpanelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/20">
                <CheckCircle2 className="w-3 h-3" />
                PM-JAY Empanelled
              </span>
            )}
            {accreditation.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 bg-background/50 text-muted-foreground text-xs font-semibold rounded-full border border-white/10"
              >
                {a}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-bold text-foreground leading-snug">{name}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{city ?? hospital.address ?? "India"}</span>
            {distance_km != null && (
              <span className="ml-1 text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-md">
                {distance_km.toFixed(1)} km
              </span>
            )}
          </div>
        </div>

        {/* Verification badge — top-right, unmissable */}
        <div className="flex-shrink-0">
          <VerificationBadge
            status={verificationStatus}
            lastVerified={lastVerified}
          />
        </div>
      </div>

      {/* Cost estimate */}
      <div className="mb-4 p-3 glass bg-gradient-to-r from-white/5 to-primary/5 rounded-xl border border-white/10">
        {pmjayEmpanelled && (costMin != null || estimatedAvgCost) ? (
          /* ── DUAL COST: PM-JAY + Regular ── */
          <div className="grid grid-cols-2 gap-3">
            {/* PM-JAY column */}
            <div className="flex items-start gap-2.5 p-2.5 bg-success/5 rounded-lg border border-success/10">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-success" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-success/70 mb-0.5">PM-JAY Beneficiary</p>
                <p className="text-lg font-extrabold text-success">Free</p>
                <p className="text-[10px] text-success/60 font-medium">Subsidized Rates</p>
              </div>
            </div>
            {/* Non-PM-JAY column */}
            <div className="flex items-start gap-2.5 p-2.5 bg-background/50 rounded-lg border border-white/10">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <IndianRupee className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Without PM-JAY</p>
                {costMin != null && costMax != null ? (
                  <>
                    <p className="text-lg font-extrabold text-foreground">{formatCost(costMin)} – {formatCost(costMax)}</p>
                    <p className="text-[10px] text-primary font-semibold">Avg: {formatCost(Math.round((costMin + costMax) / 2))}</p>
                  </>
                ) : estimatedAvgCost ? (
                  <>
                    <p className="text-lg font-extrabold text-foreground">~{formatCost(estimatedAvgCost)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Est. for {matchingSpecialty}</p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">Contact for pricing</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── SINGLE COST ROW ── */
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              {costMin != null && costMax != null ? (
                <>
                  <p className="text-xs text-muted font-medium mb-0.5">Estimated Cost Range</p>
                  <p className="text-xl font-extrabold text-foreground tracking-tight">
                    {formatCost(costMin)} – {formatCost(costMax)}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    Avg: {formatCost(Math.round((costMin + costMax) / 2))}
                  </p>
                </>
              ) : pmjayEmpanelled ? (
                <div>
                  <p className="text-xs text-muted font-medium mb-0.5">PM-JAY Beneficiary</p>
                  <p className="text-base font-bold text-success leading-tight">Free / Subsidized Rates</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-muted font-medium mb-0.5">Pricing</p>
                    <p className="text-base font-semibold text-muted-foreground">Contact for pricing</p>
                  </div>
                  {estimatedAvgCost && (
                    <div className="border-t border-white/10 pt-1.5 mt-0.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Estimated Avg Cost</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCost(estimatedAvgCost)} <span className="text-xs font-normal text-muted-foreground">for {matchingSpecialty}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Facilities */}
      <div className="flex flex-wrap gap-2 mb-4">
        {shownFacilities.map((f) => {
          const Icon = FACILITY_ICONS[f] ?? Activity;
          return (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 px-3 py-1 glass border border-white/10 rounded-full text-xs font-medium text-foreground shadow-sm"
            >
              <Icon className="w-3 h-3 text-primary" />
              {f}
            </span>
          );
        })}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 glass border border-white/10 rounded-full text-xs font-medium text-muted-foreground">
            +{hiddenCount} more
          </span>
        )}
      </div>

      {/* Annual volume — muted trust signal */}
      <p className="text-xs text-muted mb-4">
        {annualProcedureVolume != null
          ? `${annualProcedureVolume.toLocaleString("en-IN")} procedures/year · `
          : ""}Data source:{" "}
        <span className="capitalize font-medium">{sourceType}</span>
      </p>

      {/* ── DYNAMIC EXPLAINABILITY SECTION ── */}
      <div className="border-t border-border pt-3 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Why this result
        </p>
        <div className="flex flex-wrap gap-2">
          {explainChips.map((chip, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${CHIP_COLORS[chip.color]}`}
            >
              {chip.icon}
              {chip.label && <span className="font-bold">{chip.label}:</span>}
              <span className="font-medium">{chip.detail}</span>
            </span>
          ))}
          {explainChips.length === 0 && (
            <span className="text-xs text-muted italic">General result</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
        <button
          onClick={handleCompareClick}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            isSelected
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-primary-light text-primary hover:bg-primary/20 border border-primary/20"
          }`}
        >
          {isSelected ? (
            <>
              <MinusCircle className="w-4 h-4" />
              Remove from Compare
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Add to Compare
            </>
          )}
        </button>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/10 glass text-foreground hover:bg-white/10 transition-colors"
        >
          <MapPin className="w-4 h-4 text-primary" />
          Directions
        </a>
        <Link
          href={`/hospital/${hospitalId}`}
          className="btn-primary text-sm text-center py-2 px-6"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
