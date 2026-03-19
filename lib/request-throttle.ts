import "server-only";

import { headers } from "next/headers";
import { PRODUCT_SLUG } from "@/lib/brand";
import { isEnvEnabled } from "@/lib/env";

type BucketEntry = {
  count: number;
  expiresAt: number;
};

type RateLimiterStore = Map<string, BucketEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __githubprintRateLimiterStore: RateLimiterStore | undefined;
}

function getStore() {
  if (!globalThis.__githubprintRateLimiterStore) {
    globalThis.__githubprintRateLimiterStore = new Map();
  }

  return globalThis.__githubprintRateLimiterStore;
}

function isThrottleEnabled() {
  return (
    process.env.NODE_ENV === "production" &&
    !isEnvEnabled("GITHUBPRINT_DISABLE_THROTTLE", "GITFOLIO_DISABLE_THROTTLE")
  );
}

function getRequestFingerprint(rawHeaders: Headers) {
  const forwarded = rawHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = rawHeaders.get("x-real-ip")?.trim();
  const userAgent = rawHeaders.get("user-agent")?.trim();

  return forwarded || realIp || userAgent || "anonymous";
}

function consume(
  key: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || current.expiresAt <= now) {
    store.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { allowed: true, retryAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAt: current.expiresAt };
  }

  current.count += 1;
  store.set(key, current);

  return { allowed: true, retryAt: current.expiresAt };
}

export class RequestThrottleError extends Error {
  retryAt?: string;

  constructor(message: string, retryAt?: string) {
    super(message);
    this.name = "RequestThrottleError";
    this.retryAt = retryAt;
  }
}

export async function assertResultRequestAllowed(options?: {
  forceFresh?: boolean;
}) {
  if (!isThrottleEnabled()) {
    return;
  }

  const rawHeaders = await headers();
  const fingerprint = getRequestFingerprint(rawHeaders);
  const analysisBucket = consume(`${PRODUCT_SLUG}:result:${fingerprint}`, 8, 60 * 1000);

  if (!analysisBucket.allowed) {
    throw new RequestThrottleError(
      "Too many result requests.",
      new Date(analysisBucket.retryAt).toISOString(),
    );
  }

  if (options?.forceFresh) {
    const refreshBucket = consume(
      `${PRODUCT_SLUG}:result-refresh:${fingerprint}`,
      1,
      5 * 60 * 1000,
    );

    if (!refreshBucket.allowed) {
      throw new RequestThrottleError(
        "Too many refresh requests.",
        new Date(refreshBucket.retryAt).toISOString(),
      );
    }
  }
}
