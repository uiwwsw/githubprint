import type { Locale } from "@/lib/schemas";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
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
    empty: "GitHub URL을 입력해 주세요.",
    invalid_format: "올바른 GitHub URL 형식이 아닙니다.",
    invalid_host: "github.com 형태의 URL만 입력할 수 있습니다.",
    missing_username: "GitHub 사용자 이름을 URL에서 찾지 못했습니다.",
  },
  en: {
    empty: "Please enter a GitHub URL.",
    invalid_format: "This does not look like a valid GitHub URL.",
    invalid_host: "Only github.com URLs are accepted.",
    missing_username: "Could not extract a GitHub username from the URL.",
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

export function normalizeGitHubUrlInput(input: string, locale: Locale = "ko") {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new GitHubUrlError("empty", locale);
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

  if (!username || RESERVED_SEGMENTS.has(username.toLowerCase())) {
    throw new GitHubUrlError("missing_username", locale);
  }

  return {
    original: input,
    normalizedUrl: url.toString(),
    username,
    canonicalProfileUrl: `https://github.com/${username}`,
    repoName: segments[1] ?? null,
  };
}
