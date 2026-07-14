import { BASE_URL } from "@/lib/baseURL";
import { getCsrfToken } from "@/lib/utils";

/**
 * Revokes the server session, then clears client cookies, localStorage,
 * and sessionStorage, and navigates to `/` (login/setup).
 */
export async function forceCockpitLogout() {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
    });
  } catch {
    /* still wipe client state */
  }

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((raw) => {
      const eq = raw.indexOf("=");
      const name = (eq > -1 ? raw.slice(0, eq) : raw).trim();
      if (!name) return;
      const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `${name}=;${expire};path=/`;
      if (host) {
        document.cookie = `${name}=;${expire};path=/;domain=${host}`;
        document.cookie = `${name}=;${expire};path=/;domain=.${host}`;
      }
    });
  }

  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  window.location.href = "/";
}
