/**
 * After login/register, optionally return the user here (same-origin paths only).
 */
export function sanitizePostAuthRedirect(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const decoded = decodeURIComponent(raw.trim());
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://")) return null;
  if (decoded.startsWith("/auth/login") || decoded.startsWith("/auth/register")) return null;
  return decoded.length > 1 && decoded.endsWith("/") ? decoded.slice(0, -1) : decoded;
}

export function bookingLoginUrl(returnPath?: string): string {
  const path =
    returnPath ??
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const safe = sanitizePostAuthRedirect(path) ?? "/";
  return `/auth/login?redirect=${encodeURIComponent(safe)}`;
}

export function bookingRegisterUrl(returnPath?: string): string {
  const path =
    returnPath ??
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const safe = sanitizePostAuthRedirect(path) ?? "/";
  return `/auth/register?redirect=${encodeURIComponent(safe)}`;
}
