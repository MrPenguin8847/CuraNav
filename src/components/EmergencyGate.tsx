"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Siren, ArrowRight } from "lucide-react";

const GATE_KEY = "curanav:emergency-gate-done";

const SKIP_PATHS = ["/admin", "/emergency"];

/**
 * EmergencyGate
 *
 * Shown once per session on the first page load: "Is this an emergency?"
 *  - Yes  → redirects to /emergency (nearest hospital flow)
 *  - No   → dismisses and lets the user browse normally
 *
 * The choice is remembered in sessionStorage so regular browsing is not
 * interrupted again within the same session.
 */
export function EmergencyGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(GATE_KEY) === "true";
    } catch {
      // sessionStorage unavailable — assume not dismissed yet
    }

    if (!dismissed) {
      const showTimer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(showTimer);
    }
  }, [pathname]);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(GATE_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleEmergency = () => {
    dismiss();
    router.push("/emergency");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-gate-title"
    >
      <div className="glass bg-background/95 border border-white/10 rounded-3xl shadow-2xl shadow-black/60 max-w-md w-full p-8 text-center space-y-6 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto">
          <Siren className="w-8 h-8 text-error" />
        </div>

        <div className="space-y-2">
          <h2
            id="emergency-gate-title"
            className="text-2xl font-extrabold text-foreground tracking-tight"
          >
            Is this an emergency?
          </h2>
          <p className="text-sm text-muted-foreground">
            If someone needs urgent medical care right now, we&apos;ll find the
            nearest hospital to your location.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEmergency}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-error text-white font-bold rounded-xl hover:bg-error/90 transition-colors shadow-lg shadow-error/25"
          >
            <Siren className="w-5 h-5" />
            Yes, it&apos;s an emergency
          </button>
          <button
            onClick={dismiss}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-muted-foreground font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            No, browse normally
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          Time-critical? Call national emergency helpline{" "}
          <a href="tel:112" className="font-bold text-error hover:underline">
            112
          </a>{" "}
          or ambulance{" "}
          <a href="tel:108" className="font-bold text-error hover:underline">
            108
          </a>
          .
        </p>
      </div>
    </div>
  );
}