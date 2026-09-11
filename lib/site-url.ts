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
