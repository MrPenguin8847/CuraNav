"use client";

import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { TransparencyNotice } from "@/lib/searchIntent";

interface SearchNoticesProps {
  notices: TransparencyNotice[];
  /** Extra notes from the hospitals API, e.g. a widened radius. */
  serverNotes?: string[];
}

/**
 * Renders every place the search had to deviate from what was asked.
 *
 * This component exists because the previous behaviour was to deviate
 * *silently*: an unresolved specialty or an unindexed city simply produced
 * fewer or zero results, which reads as a broken tool rather than a limitation
 * of the data. Nothing is broadened without a line of explanation here.
 */
export function SearchNotices({ notices, serverNotes = [] }: SearchNoticesProps) {
  const all: TransparencyNotice[] = [
    ...notices,
    ...serverNotes.map((message) => ({
      id: `server-${message.slice(0, 24)}`,
      severity: "info" as const,
      message,
    })),
  ];

  if (all.length === 0) return null;

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {all.map((notice) => {
        const isWarning = notice.severity === "warning";
        return (
          <div
            key={notice.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
              isWarning
                ? "bg-warning/10 border-warning/25 text-warning"
                : "bg-background/40 border-white/10 text-muted-foreground"
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
            ) : (
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
            )}
            <div className="space-y-1.5">
              <p className="leading-relaxed">{notice.message}</p>
              {notice.suggestion && (
                <p className="flex items-start gap-1.5 text-xs text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>{notice.suggestion}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
