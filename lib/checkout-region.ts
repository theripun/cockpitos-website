/** sessionStorage key — set during policy / before checkout */
export const CHECKOUT_REGION_STORAGE_KEY = "cockpit_checkout_region";

function normalizeCountryToSlug(code: string | null | undefined): string {
  if (!code) return "intl";
  const s = code.trim().toUpperCase();
  if (s === "UK") return "gb";
  if (s.length === 2 && /^[A-Z]{2}$/.test(s)) return s.toLowerCase();
  return "intl";
}

async function detectFromGeolocation(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  const pos = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 120_000 }
    );
  });
  if (!pos) return null;

  const { latitude, longitude } = pos.coords;
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = (await res.json()) as { countryCode?: string };
    return typeof j.countryCode === "string" ? j.countryCode : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

async function detectFromIp(): Promise<string | null> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 6500);
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = (await res.json()) as { country_code?: string };
    return typeof j.country_code === "string" ? j.country_code : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

function detectFromLocaleHints(): string | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const m = locale.match(/-([A-Za-z]{2})$/);
    if (m) return m[1].toUpperCase();
  } catch {
    /* ignore */
  }
  const langs = typeof navigator !== "undefined" ? navigator.languages : [];
  const primary = typeof navigator !== "undefined" ? navigator.language : "";
  for (const lang of [...(langs || []), primary].filter(Boolean)) {
    const m = lang.match(/-([A-Za-z]{2})\b/);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/**
 * Resolves a URL segment for localized checkout paths (`/in/checkout`, `/gb/checkout`, …).
 * Uses browser geolocation (with permission) when available, then IP geo, then locale hints.
 */
export async function detectCheckoutRegionSlug(): Promise<string> {
  if (typeof window === "undefined") return "intl";

  try {
    const geo = await detectFromGeolocation();
    const slug = normalizeCountryToSlug(geo);
    if (slug !== "intl") return slug;
  } catch {
    /* continue */
  }

  try {
    const ip = await detectFromIp();
    const slug = normalizeCountryToSlug(ip);
    if (slug !== "intl") return slug;
  } catch {
    /* continue */
  }

  return normalizeCountryToSlug(detectFromLocaleHints());
}

export function readStoredCheckoutRegionSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_REGION_STORAGE_KEY);
    if (!raw || raw.length < 2) return null;
    const s = raw.toLowerCase();
    if (s === "intl") return "intl";
    if (s.length === 2 && /^[a-z]{2}$/.test(s)) return s;
    return null;
  } catch {
    return null;
  }
}

export function storeCheckoutRegionSlug(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHECKOUT_REGION_STORAGE_KEY, slug);
  } catch {
    /* private mode */
  }
}

/** True for `/checkout` and localized `/in/checkout`, `/intl/checkout`, etc. */
export function isCheckoutPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return true;
  return /^\/(?:[a-z]{2}|intl)\/checkout(?:\/|$)/.test(pathname);
}
