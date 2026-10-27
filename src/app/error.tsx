"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Siren } from "lucide-react";

/**
 * Route-level error boundary.
 *
 * Next 16 passes `retry` (not the `reset` prop older versions used). It
 * re-fetches and re-renders just the failed segment, which is the right first
 * response to a transient failure — most of what fails here is a network call.
 *
 * Note what this boundary does not do: show a stack trace or an error message.
 * In production `error.message` is scrubbed, so displaying it would only ever
 * show "An error occurred" while implying a real explanation is available.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // The digest is the only stable identifier a production error carries; it is
    // what correlates this with the server log.
    console.error("Route error", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          This page failed to load
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Something went wrong on our side, not with your search. Retrying often
          works, because most failures here are a request that timed out or a
          connection that dropped.
        </p>

        {error.digest ? (
          <p className="text-xs text-muted-foreground/60 mb-8">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => retry()}
            className="btn-primary text-sm px-5 py-2.5 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link href="/" className="btn-secondary text-sm px-5 py-2.5 inline-flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Go to homepage
          </Link>
          <Link href="/search" className="btn-secondary text-sm px-5 py-2.5 inline-flex items-center justify-center gap-2">
            Search hospitals
          </Link>
        </div>

        <p className="mt-10 pt-6 border-t border-white/10 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Siren className="w-4 h-4 text-red-400 flex-shrink-0" />
          If this is an emergency, call <strong className="text-foreground">108</strong>{" "}
          or <strong className="text-foreground">112</strong> instead.
        </p>
      </div>
    </div>
  );
}
