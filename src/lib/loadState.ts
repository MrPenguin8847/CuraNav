import { isTimeoutError } from "@/lib/fetchWithTimeout";

/**
 * Three-state request model.
 *
 * The old code modelled loading as a bare boolean plus a nullable error, which
 * makes it possible to reach a state where nothing is loading, nothing failed
 * and nothing arrived — the frozen spinner. A single discriminant removes that
 * state by construction: every render is exactly one of these.
 */
export type LoadStatus = "loading" | "success" | "error";

export interface LoadFailure {
  message: string;
  isTimeout: boolean;
}

export const IDLE_STATUS: LoadStatus = "loading";

/**
 * Turns anything thrown during a load into a message safe to show a user.
 * Keeps internal detail (stack traces, driver errors) out of the UI.
 */
export function describeError(err: unknown, fallback = "Something went wrong."): LoadFailure {
  if (isTimeoutError(err)) {
    return {
      message: "The server took too long to respond. This is usually a cold start or a slow upstream lookup — retrying usually works.",
      isTimeout: true,
    };
  }

  if (err instanceof TypeError) {
    // `fetch` rejects with a TypeError for DNS failure, offline, or CORS.
    return {
      message: "Could not reach the server. Check your internet connection and try again.",
      isTimeout: false,
    };
  }

  if (err instanceof Error && err.message) {
    return { message: err.message, isTimeout: false };
  }

  return { message: fallback, isTimeout: false };
}
