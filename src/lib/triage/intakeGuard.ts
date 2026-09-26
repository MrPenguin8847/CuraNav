/**
 * Intake screening for the free-text symptom field.
 *
 * The symptom box sits directly under guidance copy, so users sometimes paste
 * the guidance itself into it. Nothing downstream could cope with that: the
 * field accepted any text of 3+ characters, the keyword scorer legitimately
 * found no symptom clusters, and the local advisor then substituted its general
 * fallback cluster — producing a fully-formed, confident `self_care` verdict
 * with hospital recommendations for a sentence that described no patient at
 * all. A triage tool that answers a non-question is worse than one that asks
 * again.
 */

/**
 * Unambiguous evidence that the text addresses the form rather than the patient.
 * Safe to act on even when the sentence contains a first-person pronoun, because
 * "what should I write in this box" is a question about the form no matter who
 * is asking.
 */
const FORM_DIRECTED_ALWAYS: readonly RegExp[] = [
  /\bwhat\s+(should|can|do)\s+i\s+(write|type|enter|put|describe)\b/i,
  /\bhow\s+(do|should|can)\s+i\s+(describe|write|explain|answer)\b/i,
  /\bwhat\s+(does|do)\s+this\s+(box|field|form)\s+(want|need|mean)\b/i,
  /\b(where|what)\s+do\s+i\s+(type|write|start)\b/i,
  /\bthis\s+(box|field|form|textarea|question)\b/i,
  /\bhelp\s+text\b/i,
  /\b(describe|tell\s+me|tell\s+us|write)\s+(about\s+)?(your|the)\s+symptoms?\b/i,
];

/**
 * Phrases that read as form-commentary only when the sentence is not anchored
 * on a patient. These overlap heavily with real patient language — "in my own
 * words" and "is useful to know" are things people write while genuinely
 * describing symptoms — so on their own they are not enough to refuse input, and
 * they are only consulted when no first-person self-reference is present.
 */
const FORM_DIRECTED_WITHOUT_FIRST_PERSON: readonly RegExp[] = [
  /\b(plain|simple|everyday)\s+language\s+(is|works|is\s+fine)\b/i,
  /\bin\s+(your|my)\s+own\s+words\b/i,
  /\b(is|are)\s+(most\s+)?(useful|helpful|important)\b/i,
];

const FIRST_PERSON_REFERENCE =
  /\b(i|i'm|im|i've|ive|my|me|mine|myself|we|we're|our|ours|us)\b/i;

/**
 * True when the text reads as instructions or commentary about the intake form
 * rather than a description of symptoms.
 *
 * This is a necessary-but-not-sufficient signal. Callers must only reject when
 * the symptom vocabulary also found nothing — a real description that happens
 * to contain one of these phrases should still be triaged, and that pairing
 * keeps the false-rejection cost at zero for anyone actually describing a
 * problem.
 */
export function looksLikeIntakeGuidance(symptoms: string): boolean {
  if (FORM_DIRECTED_ALWAYS.some((pattern) => pattern.test(symptoms))) {
    return true;
  }
  if (FIRST_PERSON_REFERENCE.test(symptoms)) return false;
  return FORM_DIRECTED_WITHOUT_FIRST_PERSON.some((pattern) =>
    pattern.test(symptoms)
  );
}
