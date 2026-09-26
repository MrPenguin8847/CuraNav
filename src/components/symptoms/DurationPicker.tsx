"use client";

import { Clock, Gauge } from "lucide-react";
import {
  DURATION_OPTIONS,
  INTENSITY_OPTIONS,
  type DurationBucket,
  type Intensity,
} from "@/lib/triage/types";

type Props = {
  duration: DurationBucket;
  intensity: Intensity;
  onDurationChange: (value: DurationBucket) => void;
  onIntensityChange: (value: Intensity) => void;
};

const cardBase =
  "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all";

function optionClass(active: boolean, tone: "primary" | "error" = "primary") {
  if (!active) {
    return `${cardBase} border-white/10 bg-white/[0.02] hover:bg-white/5`;
  }
  return tone === "error"
    ? `${cardBase} border-error/40 bg-error/10 ring-1 ring-error/30`
    : `${cardBase} border-primary/40 bg-primary/10 ring-1 ring-primary/30`;
}

export function DurationPicker({
  duration,
  intensity,
  onDurationChange,
  onIntensityChange,
}: Props) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">
            How long have you had these symptoms?
          </span>
        </legend>
        <p className="text-sm text-muted-foreground mb-3">
          Duration is one of the strongest signals for how urgently this needs
          to be looked at.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((option) => {
            const active = duration === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onDurationChange(option.value)}
                aria-pressed={active}
                className={optionClass(active)}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    active
                      ? "border-primary bg-primary"
                      : "border-white/25"
                  }`}
                />
                <span
                  className={`text-sm ${
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 mb-1">
          <Gauge className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">
            How much is it affecting you?
          </span>
        </legend>
        <p className="text-sm text-muted-foreground mb-3">
          Choose the answer closest to how you are right now, not how it started.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {INTENSITY_OPTIONS.map((option) => {
            const active = intensity === option.value;
            const tone = option.value === "severe" ? "error" : "primary";
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onIntensityChange(option.value)}
                aria-pressed={active}
                className={optionClass(active, tone)}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    active
                      ? tone === "error"
                        ? "border-error bg-error"
                        : "border-primary bg-primary"
                      : "border-white/25"
                  }`}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${
                      active
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground/80 mt-0.5">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
