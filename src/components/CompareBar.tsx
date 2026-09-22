"use client";

import Link from "next/link";
import { GitCompare, X } from "lucide-react";

interface CompareBarProps {
  selectedIds: string[];
  hospitalNames: Record<string, string>;
  onRemove: (id: string) => void;
}

export function CompareBar({ selectedIds, hospitalNames, onRemove }: CompareBarProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t-2 border-primary/30 shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <GitCompare className="w-5 h-5 text-white/80" />
            <span className="text-white font-semibold text-sm">
              {selectedIds.length} hospital{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2 min-w-0">
            {selectedIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1 rounded-full max-w-[180px] truncate"
              >
                <span className="truncate">{hospitalNames[id] ?? id}</span>
                <button
                  onClick={() => onRemove(id)}
                  className="flex-shrink-0 hover:text-white/60 transition-colors"
                  aria-label={`Remove ${hospitalNames[id]} from compare`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <Link
          href={`/compare?ids=${selectedIds.join(",")}`}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-white/90 transition-colors shadow-sm"
        >
          <GitCompare className="w-4 h-4" />
          Compare Now
        </Link>
      </div>
    </div>
  );
}
