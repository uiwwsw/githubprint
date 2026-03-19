import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import { PRODUCT_NAME, PRODUCT_SLUG } from "@/lib/brand";
import { readEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";

type GitHubAccessTokenResponse = {
  access_token?: string;
  error?: string;
  scope?: string;
  token_type?: string;
};

type GitHubViewerResponse = {
  avatar_url: string;
  email: string | null;
  html_url: string;
  login: string;
  name: string | null;
};

type GitHubStatePayload = {
  redirectTo: string;
  state: string;
};

export type GitHubAuthSession = {
  accessToken: string;
  createdAt: string;
  scopes: string[];
  user: {
    avatarUrl: string;
    email: string | null;
    login: string;
    name: string | null;
    profileUrl: string;
  };
};

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_BASE = "https://api.github.com";

export const GITHUB_AUTH_SCOPES = ["read:user", "user:email", "repo"];

export const GITHUB_SESSION_COOKIE_NAME = `${PRODUCT_SLUG}-github-session`;
export const GITHUB_STATE_COOKIE_NAME = `${PRODUCT_SLUG}-github-oauth-state`;

export const GITHUB_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const GITHUB_STATE_MAX_AGE_SECONDS = 60 * 10;

export function sanitizeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function getSessionSecret() {
  return readEnv("GITHUB_SESSION_SECRET");
}

function getOAuthConfig() {
  const clientId = readEnv("GITHUB_CLIENT_ID");
  const clientSecret = readEnv("GITHUB_CLIENT_SECRET");
  const sessionSecret = getSessionSecret();

  return {
    clientId,
    clientSecret,
    sessionSecret,
  };
}

function getRequiredOAuthConfig() {
  const config = getOAuthConfig();

  if (!config.clientId || !config.clientSecret || !config.sessionSecret) {
    throw new Error("GitHub OAuth is not configured.");
  }

  return config;
}

function getEncryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function sealValue<T>(value: T, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

function unsealValue<T>(value: string, secret: string) {
  const [ivPart, tagPart, ciphertextPart] = value.split(".");

  if (!ivPart || !tagPart || !ciphertextPart) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(secret),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, "base64url")),
      decipher.final(),
    ]);

    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    return null;
  }
}

function buildGitHubHeaders(accessToken: string, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);

  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("User-Agent", PRODUCT_NAME);

  return headers;
}

export function hasGitHubOAuthConfig() {
  const config = getOAuthConfig();
  return Boolean(config.clientId && config.clientSecret && config.sessionSecret);
}

export function createGitHubOAuthState() {
  return randomBytes(18).toString("base64url");
}

export function createGitHubAuthStateValue(payload: GitHubStatePayload) {
  const { sessionSecret } = getRequiredOAuthConfig();
  return sealValue(payload, sessionSecret);
}

export function readGitHubAuthState(value?: string | null) {
  if (!value) {
    return null;
  }

  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  return unsealValue<GitHubStatePayload>(value, secret);
}

export function createGitHubSessionValue(session: GitHubAuthSession) {
  const { sessionSecret } = getRequiredOAuthConfig();
  return sealValue(session, sessionSecret);
}

export function getGitHubCallbackUrl() {
  return new URL("/api/auth/github/callback", getSiteUrl()).toString();
}

export function buildGitHubLoginPath(redirectTo?: string | null) {
  return `/api/auth/github/login?redirect=${encodeURIComponent(
    sanitizeRedirectPath(redirectTo),
  )}`;
}

export function buildGitHubLogoutPath(redirectTo?: string | null) {
  return `/api/auth/logout?redirect=${encodeURIComponent(
    sanitizeRedirectPath(redirectTo),
  )}`;
}

export function buildGitHubAuthorizeUrl(state: string) {
  const { clientId } = getRequiredOAuthConfig();
  const url = new URL(GITHUB_AUTHORIZE_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getGitHubCallbackUrl());
  url.searchParams.set("scope", GITHUB_AUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeGitHubCodeForSession(code: string) {
  const { clientId, clientSecret } = getRequiredOAuthConfig();
  const tokenResponse = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": PRODUCT_NAME,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getGitHubCallbackUrl(),
    }),
    cache: "no-store",
  });

  const tokenJson = (await tokenResponse.json()) as GitHubAccessTokenResponse;

  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error || "GitHub token exchange failed.");
  }

  const viewerResponse = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: buildGitHubHeaders(tokenJson.access_token),
    cache: "no-store",
  });

  if (!viewerResponse.ok) {
    throw new Error("GitHub user lookup failed.");
  }

  const viewer = (await viewerResponse.json()) as GitHubViewerResponse;
  const scopeHeader = tokenJson.scope ?? viewerResponse.headers.get("x-oauth-scopes") ?? "";
  const scopes = scopeHeader
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    accessToken: tokenJson.access_token,
    createdAt: new Date().toISOString(),
    scopes,
    user: {
      avatarUrl: viewer.avatar_url,
      email: viewer.email,
      login: viewer.login,
      name: viewer.name,
      profileUrl: viewer.html_url,
    },
  } satisfies GitHubAuthSession;
}

export async function getGitHubSession() {
  if (!hasGitHubOAuthConfig()) {
    return null;
  }

  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(GITHUB_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return unsealValue<GitHubAuthSession>(sessionCookie, sessionSecret);
}
