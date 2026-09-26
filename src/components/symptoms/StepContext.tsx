"use client";

import { User, Cake, HeartPulse } from "lucide-react";
import {
  AGE_OPTIONS,
  canBePregnant,
  PREGNANCY_ONLY_CONDITIONS,
  type AgeGroup,
} from "@/lib/triage/types";

const CONDITIONS = [
  "Diabetes",
  "High blood pressure",
  "Heart disease",
  "Asthma or COPD",
  "Kidney disease",
  "Liver disease",
  "Cancer",
  "Epilepsy",
  "Pregnancy",
  "Immunosuppressed",
  "None of these",
];

type Props = {
  age: AgeGroup | null;
  sex: "female" | "male" | "other" | null;
  isPregnant: boolean;
  existingConditions: string;
  currentMedications: string;
  onChange: (patch: Partial<{
    age: AgeGroup | null;
    sex: "female" | "male" | "other" | null;
    isPregnant: boolean;
    existingConditions: string;
    currentMedications: string;
  }>) => void;
};

function toggleCondition(current: string, condition: string): string {
  const list = current
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (condition === "None of these") {
    return list.includes(condition) ? "" : condition;
  }
  // "None of these" and a real condition are mutually exclusive.
  if (list.includes(condition)) {
    return list.filter((c) => c !== condition).join(", ");
  }
  return [...list.filter((c) => c !== "None of these"), condition].join(", ");
}

const inputClass =
  "w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

export function StepContext({
  age,
  sex,
  isPregnant,
  existingConditions,
  currentMedications,
  onChange,
}: Props) {
  const selected = existingConditions
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // A patient recorded as male is never asked about pregnancy, and is never
  // offered "Pregnancy" as a pre-existing condition. `normalize` clears any
  // value that got in before the sex was known, so nothing stale is left to
  // render here.
  const pregnancyPossible = canBePregnant(sex);
  const conditions = pregnancyPossible
    ? CONDITIONS
    : CONDITIONS.filter((c) => !PREGNANCY_ONLY_CONDITIONS.has(c));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-base font-bold text-foreground">A little about you</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Age and existing conditions change how the same symptoms should be
          read. Everything here is optional except your age group.
        </p>
      </div>

      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-bold text-foreground mb-2.5">
          <Cake className="w-4 h-4 text-primary" />
          Age group
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AGE_OPTIONS.map((option) => {
            const active = age === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({ age: active ? null : option.value })
                }
                aria-pressed={active}
                className={`rounded-xl border px-3 py-2.5 text-xs transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-semibold ring-1 ring-primary/30"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-bold text-foreground mb-2.5">
          <User className="w-4 h-4 text-primary" />
          Sex
        </legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["female", "Female"],
              ["male", "Male"],
              ["other", "Other / prefer not to say"],
            ] as const
          ).map(([value, label]) => {
            const active = sex === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ sex: active ? null : value })}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-semibold ring-1 ring-primary/30"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {pregnancyPossible && (
        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isPregnant}
            onChange={(e) => onChange({ isPregnant: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-white/25 accent-[var(--color-primary)] flex-shrink-0"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <HeartPulse className="w-4 h-4 text-primary" />
              Currently pregnant, or within 6 weeks of giving birth
            </span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Pregnancy changes the threshold for several symptoms, so we flag
              these presentations for earlier review.
            </span>
          </span>
        </label>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-foreground mb-2.5">
          Existing health conditions
        </legend>
        <div className="flex flex-wrap gap-2">
          {conditions.map((condition) => {
            const active = selected.includes(condition);
            return (
              <button
                key={condition}
                type="button"
                onClick={() =>
                  onChange({
                    existingConditions: toggleCondition(existingConditions, condition),
                  })
                }
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-2 text-xs transition-all ${
                  active
                    ? "border-info/40 bg-info/10 text-foreground font-semibold ring-1 ring-info/30"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                }`}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="triage-medications"
          className="text-sm font-bold text-foreground block mb-2"
        >
          Medicines you are currently taking{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="triage-medications"
          type="text"
          value={currentMedications}
          onChange={(e) => onChange({ currentMedications: e.target.value })}
          placeholder="e.g. metformin, amlodipine, thyroid tablet"
          maxLength={300}
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          This is only passed to the structuring model to help it read your
          symptoms in context. It is not stored anywhere.
        </p>
      </div>
    </div>
  );
}
