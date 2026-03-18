import type { Locale } from "@/lib/schemas";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const GITHUB_PATH_PREFIX = /^(?:https?:\/\/)?(?:www\.)?github\.com(?:\/|$)/i;
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const RESERVED_SEGMENTS = new Set([
  "",
  "about",
  "collections",
  "contact",
  "enterprise",
  "events",
  "explore",
  "features",
  "issues",
  "login",
  "marketplace",
  "new",
  "notifications",
  "orgs",
  "organizations",
  "pricing",
  "pulls",
  "search",
  "security",
  "sessions",
  "settings",
  "signup",
  "site",
  "sponsors",
  "topics",
  "trending",
]);

type GitHubUrlErrorCode =
  | "empty"
  | "invalid_format"
  | "invalid_host"
  | "missing_username";

const urlErrorMessages: Record<Locale, Record<GitHubUrlErrorCode, string>> = {
  ko: {
    empty: "GitHub URL 또는 아이디를 입력해 주세요.",
    invalid_format: "올바른 GitHub URL 또는 아이디 형식이 아닙니다.",
    invalid_host: "github.com 주소 또는 GitHub 아이디만 입력할 수 있습니다.",
    missing_username: "GitHub 사용자 이름을 찾지 못했습니다.",
  },
  en: {
    empty: "Please enter a GitHub URL or username.",
    invalid_format: "This does not look like a valid GitHub URL or username.",
    invalid_host: "Only github.com URLs or GitHub usernames are accepted.",
    missing_username: "Could not find a GitHub username in the input.",
  },
};

export class GitHubUrlError extends Error {
  code: GitHubUrlErrorCode;

  constructor(code: GitHubUrlErrorCode, locale: Locale) {
    super(urlErrorMessages[locale][code]);
    this.name = "GitHubUrlError";
    this.code = code;
  }
}

function getValidUsername(candidate: string) {
  const username = candidate.startsWith("@") ? candidate.slice(1) : candidate;

  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    return null;
  }

  if (RESERVED_SEGMENTS.has(username.toLowerCase())) {
    return null;
  }

  return username;
}

export function normalizeGitHubUrlInput(input: string, locale: Locale = "ko") {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new GitHubUrlError("empty", locale);
  }

  const directUsername = getValidUsername(trimmed);
  if (directUsername) {
    const canonicalProfileUrl = `https://github.com/${directUsername}`;
    return {
      original: input,
      normalizedUrl: canonicalProfileUrl,
      username: directUsername,
      canonicalProfileUrl,
      repoName: null,
    };
  }

  if (!GITHUB_PATH_PREFIX.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new GitHubUrlError("invalid_format", locale);
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new GitHubUrlError("invalid_format", locale);
  }

  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
    throw new GitHubUrlError("invalid_host", locale);
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const username = segments[0];

  if (!username || !getValidUsername(username)) {
    throw new GitHubUrlError("missing_username", locale);
  }

  const canonicalProfileUrl = `https://github.com/${username}`;
  return {
    original: input,
    normalizedUrl: url.toString(),
    username,
    canonicalProfileUrl,
    repoName: segments[1] ?? null,
  };
}
