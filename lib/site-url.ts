const DEFAULT_SITE_URL = "https://gitfolio-seven.vercel.app";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export { DEFAULT_SITE_URL };
