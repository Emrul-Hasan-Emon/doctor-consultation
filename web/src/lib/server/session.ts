/** Server-only helpers for the admin session cookies. */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
export const ACCESS_COOKIE = "dc_admin_access";
export const REFRESH_COOKIE = "dc_admin_refresh";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const accessCookie = (t: Tokens) => ({
  name: ACCESS_COOKIE,
  value: t.accessToken,
  ...base,
  maxAge: t.expiresIn,
});

export const refreshCookie = (t: Tokens) => ({
  name: REFRESH_COOKIE,
  value: t.refreshToken,
  ...base,
  maxAge: 30 * 24 * 60 * 60,
});

/**
 * Refresh tokens rotate, so parallel requests with an expired access token
 * must share one refresh call or the second one would fail and log the admin out.
 */
const inflight = new Map<string, Promise<Tokens | null>>();

export function refreshSession(refreshToken: string): Promise<Tokens | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;
  const p = fetch(`${BACKEND_URL}/api/auth/admin/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })
    .then(async (res) => (res.ok ? ((await res.json()) as Tokens) : null))
    .catch(() => null)
    .finally(() => setTimeout(() => inflight.delete(refreshToken), 10_000));
  inflight.set(refreshToken, p);
  return p;
}
