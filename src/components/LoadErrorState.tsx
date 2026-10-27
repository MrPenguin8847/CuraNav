"use client";

import { AlertTriangle, RefreshCw, Phone } from "lucide-react";
import type { LoadFailure } from "@/lib/loadState";

interface LoadErrorStateProps {
  title: string;
  failure: LoadFailure;
  onRetry?: () => void;
  /** Shown for time-critical flows so the user is never left without a next step. */
  showEmergencyNumbers?: boolean;
}

/**
 * The single rendering for a failed load: what went wrong, a retry that
 * actually re-runs the request, and a fallback for people who cannot wait.
 */
export function LoadErrorState({
  title,
  failure,
  onRetry,
  showEmergencyNumbers = false,
}: LoadErrorStateProps) {
  return (
    <div className="card p-8 text-center space-y-4" role="alert">
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-error" />
      </div>

      <div className="space-y-1.5">
        <p className="text-foreground font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{failure.message}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
        {showEmergencyNumbers && (
          <p className="text-sm text-muted-foreground">
            Need care now? Call{" "}
            <a href="tel:108" className="font-bold text-error">108</a> or{" "}
            <a href="tel:112" className="font-bold text-error">112</a>
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground/60 inline-flex items-center gap-1.5">
        <Phone className="w-3 h-3" />
        We never withhold emergency options because of a loading failure.
      </p>
    </div>
  );
}
