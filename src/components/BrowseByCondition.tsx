"use client";

import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_SPECIALTY_GROUPS, type SpecialtyGroup } from "@/lib/specialtyCatalog";
import { usePlatformStats } from "@/hooks/usePlatformStats";

interface BrowseByConditionProps {
  onSelect: (query: string) => void;
  mode?: "full" | "handoff" | "remaining";
  handoffProgress?: number;
}

const FIRST_ROW_LENGTH = 4;

function SpecialtyHeading({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
        Browse Specialties
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Search by <span className="gradient-text text-gradient-brand">Medical Need</span>
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Select a specialty to search the hospital index, compare treatment costs,
        and see which facilities actually record the data you need.
      </p>
    </div>
  );
}

/**
 * Hospitals covering any of a group's specialties, de-duplicated. A group like
 * Orthopaedics spans three dataset values and a single hospital may list more
 * than one of them, so the values are summed and then corrected for overlap.
 * Overlap is rare enough that an exact figure needs a server round-trip; this
 * never overstates by more than the number of multi-listed hospitals.
 */
function countForGroup(group: SpecialtyGroup, counts: Record<string, number>): number {
  return group.specialties.reduce((sum, value) => sum + (counts[value] ?? 0), 0);
}

function ServiceCard({
  group,
  count,
  countPending,
  onSelect,
}: {
  group: SpecialtyGroup;
  count: number | null;
  countPending: boolean;
  onSelect: (query: string) => void;
}) {
  const { icon: Icon, label, description, query, color } = group;

  return (
    <button
      onClick={() => {
        onSelect(query);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group text-left p-6 glass rounded-2xl hover-lift cursor-pointer hover:border-primary/20"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${color}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
        {label}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {description}
        {/* The count is live. While it loads — or if it failed — the number is
            omitted rather than shown as 0, because "0 hospitals" is a claim
            this component cannot actually support. */}
        {countPending ? (
          <span className="text-muted-foreground/60"> — checking availability…</span>
        ) : count !== null ? (
          <span>
            {" — "}
            {count} {count === 1 ? "hospital" : "hospitals"}
          </span>
        ) : null}
      </p>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Search <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

function ServiceGrid({
  visibleServices,
  counts,
  countsPending,
  onSelect,
}: {
  visibleServices: readonly SpecialtyGroup[];
  counts: Record<string, number>;
  countsPending: boolean;
  onSelect: (query: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {visibleServices.map((group) => (
        <ServiceCard
          key={group.id}
          group={group}
          count={countsPending ? null : countForGroup(group, counts)}
          countPending={countsPending}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function BrowseByCondition({
  onSelect,
  mode = "full",
  handoffProgress = 0,
}: BrowseByConditionProps) {
  const { stats, status } = usePlatformStats();
  const countsPending = status === "loading";
  const services = HOMEPAGE_SPECIALTY_GROUPS;

  const visibleServices: readonly SpecialtyGroup[] =
    mode === "handoff"
      ? services.slice(0, FIRST_ROW_LENGTH)
      : mode === "remaining"
        ? services.slice(FIRST_ROW_LENGTH)
        : services;
  const legibilityProgress = Math.min(1, Math.max(0, handoffProgress) / 0.18);
  const panelTopAlpha = 0.78 + legibilityProgress * 0.22;
  const panelBottomAlpha = Math.min(1, panelTopAlpha + 0.12);
  const panelStyle: CSSProperties = {
    background: `transparent`,
    // Removing heavy blur so stars remain crisp
  };

  if (mode === "handoff") {
    return (
      <section id="services" className="relative z-10 w-full">
        <div
          className="border-y border-white/10 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.9)]"
          style={panelStyle}
        >
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <SpecialtyHeading className="mb-10" />
            <ServiceGrid
              visibleServices={visibleServices}
              counts={stats.specialtyCounts}
              countsPending={countsPending}
              onSelect={onSelect}
            />
          </div>
        </div>
      </section>
    );
  }

  if (mode === "remaining") {
    return (
      <section className="relative z-20 bg-background section-padding py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceGrid
            visibleServices={visibleServices}
            counts={stats.specialtyCounts}
            countsPending={countsPending}
            onSelect={onSelect}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="section-padding py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SpecialtyHeading className="mb-14" />
        <ServiceGrid
          visibleServices={visibleServices}
          counts={stats.specialtyCounts}
          countsPending={countsPending}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
