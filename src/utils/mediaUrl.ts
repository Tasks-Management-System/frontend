import { API_BASE_URL } from "../apis/apiPath";

/**
 * Returns a browser-loadable image URL, or null if missing/invalid.
 * Handles absolute http(s), protocol-relative, data URLs, and paths served from the API origin.
 */
export function resolveProfileImageUrl(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s === "null" || s === "undefined") return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("data:")) return s;

  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${origin}${path}`;
}
