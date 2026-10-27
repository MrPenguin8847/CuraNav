/**
 * Geolocation with a deadline on the *permission prompt*, not just the fix.
 *
 * The `timeout` option of `navigator.geolocation.getCurrentPosition` only bounds
 * how long the browser may spend acquiring a position. While the user is looking
 * at the permission dialog — or if a browser never fires the callback at all —
 * nothing has timed out and the success/error callback simply never runs. Any UI
 * that renders a spinner from that callback waits forever.
 *
 * `getPositionWithDeadline` therefore enforces its own timer and rejects with a
 * `GeolocationTimeoutError` so callers must handle "the user did not answer"
 * as a real outcome.
 */

export class GeolocationTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Location permission was not answered within ${Math.round(timeoutMs / 1000)}s.`);
    this.name = "GeolocationTimeoutError";
  }
}

export interface Coords {
  lat: number;
  lon: number;
}

/**
 * @param timeoutMs total budget, including time spent waiting for the prompt.
 * @param acquireTimeoutMs bounds acquiring the fix itself, passed through to
 *   the browser. Defaults to the remaining budget.
 */
export function getPositionWithDeadline(
  timeoutMs = 8_000,
  acquireTimeoutMs?: number
): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => reject(new GeolocationTimeoutError(timeoutMs)));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        finish(() => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }));
      },
      (err) => {
        finish(() => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Location permission denied."));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error("Your location is currently unavailable."));
          } else {
            reject(err instanceof Error ? err : new Error("Could not get your location."));
          }
        });
      },
      { enableHighAccuracy: false, timeout: acquireTimeoutMs ?? timeoutMs }
    );
  });
}
