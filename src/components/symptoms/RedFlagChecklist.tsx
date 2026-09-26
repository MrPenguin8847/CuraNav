"use client";

import { AlertTriangle } from "lucide-react";
import { redFlagsByCategory } from "@/lib/triage/redFlags";

type Props = {
  selected: string[];
  onToggle: (id: string) => void;
};

/**
 * Red-flag checklist. Presented as an explicit self-screen rather than being
 * inferred from free text alone, because a patient often recognises a warning
 * sign instantly but cannot describe it in clinical words.
 */
export function RedFlagChecklist({ selected, onToggle }: Props) {
  const groups = redFlagsByCategory();
  const selectedSet = new Set(selected);

  return (
    <fieldset>
      <legend className="flex items-start gap-2 mb-1">
        <AlertTriangle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
        <span>
          <span className="block text-base font-bold text-foreground">
            Do any of these apply to you right now?
          </span>
          <span className="block text-sm font-normal text-muted-foreground mt-0.5">
            Tick anything that is happening at the moment. If any apply, we will
            direct you to emergency care immediately — no appointment needed.
          </span>
        </span>
      </legend>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div
            key={group.category}
            className="rounded-2xl border border-error/15 bg-error/[0.03] p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-error/80 mb-3">
              {group.category}
            </p>
            <div className="space-y-1">
              {group.flags.map((flag) => {
                const id = flag.id;
                const isSelected = selectedSet.has(id);
                return (
                  <label
                    key={id}
                    className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-error/10 ring-1 ring-error/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(id)}
                      className="mt-0.5 w-4 h-4 rounded border-error/40 accent-[var(--color-error)] flex-shrink-0"
                    />
                    <span className="text-sm">
                      <span
                        className={
                          isSelected
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {flag.label}
                      </span>
                      {isSelected && (
                        <span className="block text-xs text-error/90 mt-0.5">
                          {flag.rationale}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
