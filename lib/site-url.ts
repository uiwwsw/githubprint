const DEFAULT_SITE_URL = "https://githubprint.vercel.app";
const LOCALHOST_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.NODE_ENV !== "production" ? LOCALHOST_SITE_URL : DEFAULT_SITE_URL);
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export { DEFAULT_SITE_URL };
