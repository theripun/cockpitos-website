const THRESHOLD_MIN = 3;
const THRESHOLD_MAX = 4;

const KEY_COUNT = "cockpit_home_app_launch_count";
const KEY_THRESHOLD = "cockpit_home_vignette_threshold";
const KEY_DISMISSED = "cockpit_home_vignette_dismissed";

/**
 * Call when the user opens or restores a desktop app from the dock (or equivalent).
 * Returns true once per session when the count crosses a random threshold (3 or 4).
 */
export function recordHomeAppOpenForVignette(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(KEY_DISMISSED) === "1") return false;

    let thresholdStr = sessionStorage.getItem(KEY_THRESHOLD);
    if (!thresholdStr) {
      thresholdStr = String(
        THRESHOLD_MIN + Math.floor(Math.random() * (THRESHOLD_MAX - THRESHOLD_MIN + 1))
      );
      sessionStorage.setItem(KEY_THRESHOLD, thresholdStr);
    }
    const threshold = parseInt(thresholdStr, 10);
    if (Number.isNaN(threshold)) return false;

    const prev = parseInt(sessionStorage.getItem(KEY_COUNT) || "0", 10);
    const next = prev + 1;
    sessionStorage.setItem(KEY_COUNT, String(next));

    return next === threshold;
  } catch {
    return false;
  }
}

export function markHomeVignetteDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY_DISMISSED, "1");
  } catch {
    /* private mode */
  }
}
