"use client";

import Link from "next/link";
import {
  MapPin,
  IndianRupee,
  Activity,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { Hospital } from "@/lib/mockHospitals";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { VerificationBadge } from "./VerificationBadge";
import { getEstimatedCost } from "@/lib/costEstimator";

interface HospitalCardProps {
  hospital: Hospital;
  isSelected: boolean;
  onToggleCompare: (id: string) => void;
  compareCount: number;
}

export function HospitalCard({
  hospital,
  isSelected,
  onToggleCompare,
  compareCount,
}: HospitalCardProps) {
  const {
    hospitalId,
    name,
    city,
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
  } = hospital;

  const shownFacilities = facilities.slice(0, 4);
  const hiddenCount = facilities.length - shownFacilities.length;

  const formatCost = (n: number | null) =>
    n != null ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L` : null;

  const matchingSpecialty = specialties[0] ?? "General";

  const whyReasons = [
    `Matches ${matchingSpecialty}`,
    distance_km != null ? `${distance_km.toFixed(1)} km away` : null,
    facilities.includes("Dialysis") ? "Has Dialysis" : null,
    pmjayEmpanelled ? "PM-JAY empanelled" : null,
    accreditation.length > 0 ? `${accreditation[0]} accredited` : null,
  ].filter(Boolean) as string[];

  const handleCompareClick = () => {
    if (!isSelected && compareCount >= 5) return;
    onToggleCompare(hospitalId);
  };

  const specialtyCost = getEstimatedCost(matchingSpecialty);
  const estimatedAvgCost = specialtyCost ? Math.round((specialtyCost.min + specialtyCost.max) / 2) : null;

  return (
    <article
      className={`card p-5 md:p-6 transition-all duration-200 ${
        isSelected
          ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30"
          : "hover:shadow-md"
      }`}
    >
      {/* Top row: Name + Verification badge */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
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
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200"
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
      <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100">
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
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-muted font-medium mb-0.5">PM-JAY Beneficiary</p>
                <p className="text-base font-bold text-success leading-tight">Free / Subsidized Rates</p>
              </div>
              {estimatedAvgCost && (
                <div className="border-t border-slate-200/70 pt-1.5 mt-0.5">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Non PM-JAY Estimated Avg</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCost(estimatedAvgCost)} <span className="text-xs font-normal text-slate-500">for {matchingSpecialty}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-muted font-medium mb-0.5">Pricing</p>
                <p className="text-base font-semibold text-slate-500">Contact for pricing</p>
              </div>
              {estimatedAvgCost && (
                <div className="border-t border-slate-200/70 pt-1.5 mt-0.5">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Estimated Avg Cost</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCost(estimatedAvgCost)} <span className="text-xs font-normal text-slate-500">for {matchingSpecialty}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Facilities */}
      <div className="flex flex-wrap gap-2 mb-4">
        {shownFacilities.map((f) => {
          const Icon = FACILITY_ICONS[f] ?? Activity;
          return (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-border rounded-full text-xs font-medium text-slate-600 shadow-sm"
            >
              <Icon className="w-3 h-3 text-primary" />
              {f}
            </span>
          );
        })}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 bg-white border border-border rounded-full text-xs font-medium text-muted">
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

      {/* Why this result */}
      <div className="border-t border-border pt-3 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Why this result
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {whyReasons.slice(0, 3).map((reason) => (
            <span key={reason} className="flex items-center gap-1 text-xs text-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
              {reason}
            </span>
          ))}
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
