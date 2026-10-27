"use client";

import { Building2, Stethoscope, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";

export function StatStrip() {
  const { stats, status, retry } = usePlatformStats();
  const loading = status === "loading";
  const failed = status === "error";

  const items = [
    {
      icon: Building2,
      value: stats.totalHospitals,
      label: "Hospitals Indexed",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Stethoscope,
      value: stats.totalSpecialties,
      label: "Specialties Covered",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      icon: ShieldCheck,
      value: stats.pmjayEmpanelled,
      label: "PM-JAY Empanelled",
      color: "text-green-400 bg-green/10",
    },
    {
      icon: Sparkles,
      value: null, // not a database number; always shown as-is
      label: "Powered Search",
      color: "text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <section className="py-6 border-y border-white/5 relative z-10 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex items-center gap-4 py-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
                  {loading ? (
                    <span className="inline-block h-6 w-12 rounded bg-white/10 animate-pulse" aria-hidden="true" />
                  ) : failed ? (
                    /* Never render 0 as if it were a measured fact. */
                    <span className="text-muted-foreground/60" title="Live statistics are unavailable">
                      &mdash;
                    </span>
                  ) : value === null ? (
                    "AI"
                  ) : (
                    `${value}`
                  )}
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {failed && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 text-warning" />
            Live counts could not be loaded
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1 underline hover:text-foreground"
            >
              <RefreshCw className="w-3 h-3" />
              try again
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
