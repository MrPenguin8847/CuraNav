"use client";

import { MapPin, IndianRupee, Stethoscope, Target, PencilLine } from "lucide-react";



interface ExplainabilityPanelProps {
  onEditSearch: () => void;
  explanation: {
    query: string;
    chips: { icon: string; label: string; value: string }[];
  } | null;
}

export function ExplainabilityPanel({ onEditSearch, explanation }: ExplainabilityPanelProps) {
  if (!explanation) return null;

  const { query, chips } = explanation;

  return (
    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            We understood your request as:
          </p>
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{query}&rdquo;
          </p>
        </div>
        <button
          onClick={onEditSearch}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline flex-shrink-0 self-start sm:self-auto"
        >
          <PencilLine className="w-3.5 h-3.5" />
          Edit search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map(({ icon, label, value }) => (
          <div
            key={label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 glass bg-background/50 border border-primary/20 rounded-full shadow-sm"
          >
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-xs text-muted-foreground font-medium">{label}:</span>
            <span className="text-xs font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
