const DEFAULT_SITE_URL = "https://githubprint.vercel.app";
const LOCALHOST_SITE_URL = "http://localhost:3000";

export function getSiteUrl(
  env: {
    NEXT_PUBLIC_SITE_URL?: string;
    NODE_ENV?: string;
    VERCEL_URL?: string;
  } = process.env,
) {
  // A deployment's unique VERCEL_URL must never become the canonical domain.
  const raw =
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (env.NODE_ENV === "production" ? DEFAULT_SITE_URL : LOCALHOST_SITE_URL);
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials.",
    );
  }
  return url.origin;
}

export { DEFAULT_SITE_URL };

// Behind Docker/Caddy/Vercel the server sees 0.0.0.0:3000, so compare the
// browser's Origin with the public site URL or the forwarded host instead.
export function isSameSiteOrigin(headers: Headers, requestOrigin?: string) {
  const origin = headers.get("origin");
  if (!origin) return false;
  if (origin === getSiteUrl() || origin === requestOrigin) return true;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
