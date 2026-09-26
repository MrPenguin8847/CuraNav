"use client";

import { ClipboardList, ArrowLeft, Send } from "lucide-react";
import { RedFlagChecklist } from "./RedFlagChecklist";
import { DurationPicker } from "./DurationPicker";
import {
  type DurationBucket,
  type Intensity,
} from "@/lib/triage/types";

type Props = {
  symptoms: string;
  duration: DurationBucket;
  intensity: Intensity;
  reportedFlags: string[];
  onSymptomsChange: (value: string) => void;
  onDurationChange: (value: DurationBucket) => void;
  onIntensityChange: (value: Intensity) => void;
  onToggleFlag: (id: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  maxLength: number;
};

const MIN_LENGTH = 3;

export function StepSymptoms({
  symptoms,
  duration,
  intensity,
  reportedFlags,
  onSymptomsChange,
  onDurationChange,
  onIntensityChange,
  onToggleFlag,
  onBack,
  onSubmit,
  submitting,
  error,
  maxLength,
}: Props) {
  const tooShort = symptoms.trim().length < MIN_LENGTH;
  const overLimit = symptoms.length > maxLength;
  const blocked = tooShort || overLimit || submitting;

  // Warn before submission, not while typing, so a user mid-sentence is not
  // scolded every keystroke.
  //
  // The message rendered below is whatever the caller put in `error`, not a
  // fixed string: the server rejects some inputs with a specific, actionable
  // reason (for example text that describes the form rather than the patient),
  // and hardcoding our own wording here meant those messages were computed and
  // then silently dropped — the user clicked submit and nothing appeared.
  const showError = error !== null && !overLimit;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-base font-bold text-foreground">
          Tell us what is going on
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Write it in your own words. The more you can say about what you can feel
          and sense, the better we can help — there are no wrong descriptions and
          no need for medical terms.
        </p>
      </div>

      <div>
        <label
          htmlFor="triage-symptoms"
          className="flex items-center gap-2 text-sm font-bold text-foreground mb-2.5"
        >
          <ClipboardList className="w-4 h-4 text-primary" />
          Your main symptoms
        </label>
        <textarea
          id="triage-symptoms"
          value={symptoms}
          onChange={(e) => onSymptomsChange(e.target.value)}
          maxLength={maxLength + 50}
          rows={5}
          placeholder="e.g. I have had a dull ache in my lower right abdomen since yesterday evening. It is worse when I press on it and I feel nauseous."
          className={`w-full rounded-xl bg-white/[0.03] border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors resize-y ${
            overLimit
              ? "border-error focus:border-error focus:ring-error/30"
              : "border-white/10 focus:border-primary focus:ring-primary/30"
          }`}
        />
        <div className="flex items-center justify-between mt-1.5">
          <p
            className={`text-xs ${
              overLimit || showError ? "text-error" : "text-muted-foreground"
            }`}
          >
            {overLimit
              ? `Too long — ${symptoms.length - maxLength} characters over the limit.`
              : showError
                ? error
                : "Avoid names, addresses, or anything identifying. You can add details later."}
          </p>
          <p
            className={`text-xs tabular-nums ${
              overLimit ? "text-error" : "text-muted-foreground"
            }`}
          >
            {symptoms.length}/{maxLength}
          </p>
        </div>
      </div>

      <RedFlagChecklist selected={reportedFlags} onToggle={onToggleFlag} />

      <DurationPicker
        duration={duration}
        intensity={intensity}
        onDurationChange={onDurationChange}
        onIntensityChange={onIntensityChange}
      />

      {error !== null && !tooShort && (
        <p
          role="alert"
          className="rounded-xl border border-error/30 bg-error/[0.07] px-4 py-3 text-sm text-foreground"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary text-sm px-5 py-3">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={blocked}
          className="btn-primary text-sm px-6 py-3"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Assessing…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Check my symptoms
            </>
          )}
        </button>
      </div>
    </div>
  );
}
