// export const BASE_URL = "https://cognode.a2.cockpit.run";

/** Browser + server: must match the API origin that set the session cookie. */
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:9100";