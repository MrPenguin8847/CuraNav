/**
 * Fetch with a hard upper bound on how long we wait.
 *
 * A bare `fetch()` never gives up on its own. When a serverless function is
 * killed for exceeding its execution budget, or an upstream geocoder stalls
 * behind a rate limit, the browser sits on a pending request indefinitely and
 * the page spins until the user navigates away. Aborting converts that silent
 * hang into a catchable error, which the UI can render as a retry button.
 *
 * Every client-side data load in this app should go through this helper.
 */

export const DEFAULT_TIMEOUT_MS = 12_000;

/** Thrown when our own deadline fires, so callers can tell it apart from a crash. */
export class RequestTimeoutError extends Error {
  readonly isTimeout = true;
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`The server took longer than ${Math.round(timeoutMs / 1000)}s to respond.`);
    this.name = "RequestTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isTimeoutError(err: unknown): boolean {
  return err instanceof RequestTimeoutError || (err instanceof Error && err.name === "RequestTimeoutError");
}

/**
 * `fetch` with a timeout, honouring any caller-supplied `init.signal` so a
 * component unmount can still cancel the request.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = init.signal ?? undefined;

  if (externalSignal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  let timedOut = false;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (timedOut) throw new RequestTimeoutError(timeoutMs);
    throw err;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
