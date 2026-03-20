import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { unstable_cache } from "next/cache";
import { mockGitHubProfile } from "@/fixtures/mock-profile";
import { PRODUCT_NAME, PRODUCT_SLUG, LEGACY_PRODUCT_SLUG } from "@/lib/brand";
import { readEnv } from "@/lib/env";
import {
  buildRepoDisplayLanguages,
  buildRepoTechStack,
  inferRepoIdentity,
  normalizeRepoDisplayLabel,
  summarizeRepoStack,
  type RepoIdentity,
  type RepoStackSummary,
} from "@/lib/repo-identity";
import type {
  AuthorizedPrivateRepoHighlight,
  AuthorizedPrivateInsights,
  ContributionSummary,
  DataMode,
  Locale,
  PrivateExposureMode,
} from "@/lib/schemas";

type GitHubUserResponse = {
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  company?: string | null;
  created_at: string;
  email?: string | null;
  followers: number;
  following: number;
  html_url: string;
  location: string | null;
  login: string;
  name: string | null;
  public_gists?: number;
  public_repos: number;
  twitter_username?: string | null;
  type: "User" | "Organization";
  updated_at: string;
};

type GitHubRepoResponse = {
  archived: boolean;
  created_at: string;
  default_branch: string;
  description: string | null;
  fork: boolean;
  forks_count: number;
  homepage: string | null;
  html_url: string;
  id: number;
  language: string | null;
  name: string;
  name_with_owner?: string;
  open_issues_count: number;
  private: boolean;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
};

type GitHubReadmeResponse = {
  content: string;
  encoding: string;
};

type GitHubContentItemResponse = {
  name: string;
  type: "dir" | "file" | "symlink" | "submodule";
};

type GitHubCommitResponse = {
  commit?: {
    message?: string;
  };
};

type GitHubPinnedResponse = {
  data?: {
    user?: {
      pinnedItems: {
        nodes: Array<{
          description: string | null;
          homepageUrl: string | null;
          name: string;
          repositoryTopics: {
            nodes: Array<{
              topic: {
                name: string;
              };
            }>;
          };
          stargazerCount: number;
          updatedAt: string;
          url: string;
        }>;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
};

type GitHubViewerContributionResponse = {
  data?: {
    viewer?: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
        };
        endedAt: string;
        startedAt: string;
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
};

export type GitHubRepoSnapshot = {
  archived: boolean;
  defaultBranch: string;
  description: string | null;
  forks: number;
  homepageUrl: string;
  identity?: RepoIdentity;
  isFork: boolean;
  isPinned: boolean;
  language: string | null;
  manifestContents?: string[];
  name: string;
  openIssuesCount: number;
  pushedAt: string;
  readme: string | null;
  recentCommitMessages: string[];
  repoUrl: string;
  rootFiles: string[];
  score: number;
  size: number;
  stars: number;
  techSignals: string[];
  topics: string[];
  updatedAt: string;
  visibility: "private" | "public";
};

export type GitHubSourceData = {
  account: {
    avatarUrl: string;
    bio: string | null;
    blogUrl: string | null;
    company: string | null;
    createdAt: string;
    email: string | null;
    followers: number;
    following: number;
    location: string | null;
    name: string | null;
    profileUrl: string;
    publicGistCount: number;
    publicRepoCount: number;
    twitterUsername: string | null;
    type: "User";
    updatedAt: string;
    username: string;
  };
  activity: {
    contributionSummary?: ContributionSummary | null;
    lastActiveAt: string | null;
    note: string;
    recentRepoCount: number;
  };
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  cacheKey: string;
  dataMode: DataMode;
  evidenceSignals: string[];
  pinnedRepoNames: string[];
  privateExposureMode: PrivateExposureMode;
  representativeRepos: GitHubRepoSnapshot[];
  repos: GitHubRepoSnapshot[];
  signalRepos?: GitHubRepoSnapshot[];
  stackSummary?: RepoStackSummary;
  topLanguages: Array<{
    name: string;
    repoCount: number;
    score: number;
  }>;
};

export class GitHubFetchError extends Error {
  code:
    | "invalid_user"
    | "not_found"
    | "organization"
    | "rate_limited"
    | "api_error";
  resetAt?: string;

  constructor(
    code: GitHubFetchError["code"],
    message: string,
    options?: { resetAt?: string },
  ) {
    super(message);
    this.name = "GitHubFetchError";
    this.code = code;
    this.resetAt = options?.resetAt;
  }
}

export type GitHubSourceAuthContext = {
  accessToken: string;
  scopes: string[];
  viewerUsername: string;
};

const GITHUB_API_BASE = "https://api.github.com";
const CACHE_WINDOW_SECONDS = 60 * 15;
const MAX_GITHUB_PAGINATION_PAGES = 20;
const README_CANDIDATE_LIMIT = 8;
const PRIVATE_README_CANDIDATE_LIMIT = 12;
const LIGHT_MODE_README_CANDIDATE_LIMIT = 3;
const REPRESENTATIVE_REPO_LIMIT = 5;
const PRIVATE_SHOWCASE_LIMIT = 2;
const SIGNAL_REPO_LIMIT = 12;
const LIGHT_MODE_REPRESENTATIVE_DETAIL_LIMIT = 2;
const ROOT_MANIFEST_FILE_NAMES = [
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pubspec.yaml",
  "Gemfile",
  "composer.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
];
const MANIFEST_CONTENT_LIMIT = 4;
const DEV_CACHE_DIR = path.join(process.cwd(), ".cache", PRODUCT_SLUG, "github");
const LEGACY_DEV_CACHE_DIR = path.join(
  process.cwd(),
  ".cache",
  LEGACY_PRODUCT_SLUG,
  "github",
);
const GRAPHQL_PINNED_QUERY = `
  query GitHubPrintPinnedRepos($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            url
            description
            homepageUrl
            stargazerCount
            updatedAt
            repositoryTopics(first: 8) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;
const GRAPHQL_VIEWER_CONTRIBUTIONS_QUERY = `
  query GitHubPrintViewerContributions {
    viewer {
      contributionsCollection {
        startedAt
        endedAt
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;

function isLocalDevelopment() {
  return process.env.NODE_ENV !== "production";
}

function isLightGitHubMode() {
  return isLocalDevelopment() && !readEnv("GITHUB_TOKEN");
}

function getReadmeCandidateLimit(usePrivateRepoScope = false) {
  return isLightGitHubMode()
    ? LIGHT_MODE_README_CANDIDATE_LIMIT
    : usePrivateRepoScope
      ? PRIVATE_README_CANDIDATE_LIMIT
      : README_CANDIDATE_LIMIT;
}

function getRepresentativeDetailLimit() {
  return isLightGitHubMode()
    ? LIGHT_MODE_REPRESENTATIVE_DETAIL_LIMIT
    : REPRESENTATIVE_REPO_LIMIT;
}

function getDevCachePath(username: string, locale: Locale) {
  return path.join(
    DEV_CACHE_DIR,
    `${username.toLowerCase().replace(/[^a-z0-9_-]/gi, "-")}--${locale}.json`,
  );
}

function getLegacyDevCachePath(username: string, locale: Locale) {
  return path.join(
    LEGACY_DEV_CACHE_DIR,
    `${username.toLowerCase().replace(/[^a-z0-9_-]/gi, "-")}--${locale}.json`,
  );
}

async function readDevCachedSource(username: string, locale: Locale) {
  if (!isLocalDevelopment()) {
    return null;
  }

  try {
    const file = await readFile(getDevCachePath(username, locale), "utf-8");
    return JSON.parse(file) as GitHubSourceData;
  } catch {
    try {
      const legacyFile = await readFile(getLegacyDevCachePath(username, locale), "utf-8");
      return JSON.parse(legacyFile) as GitHubSourceData;
    } catch {
      return null;
    }
  }
}

async function writeDevCachedSource(
  username: string,
  locale: Locale,
  source: GitHubSourceData,
) {
  if (!isLocalDevelopment()) {
    return;
  }

  try {
    await mkdir(DEV_CACHE_DIR, { recursive: true });
    await writeFile(
      getDevCachePath(username, locale),
      JSON.stringify(source, null, 2),
      "utf-8",
    );
  } catch {
    // Local cache is best-effort only.
  }
}

function buildGitHubHeaders(
  accept: string,
  initHeaders?: HeadersInit,
  accessToken?: string,
) {
  const token = accessToken?.trim() || readEnv("GITHUB_TOKEN");
  const headers = new Headers(initHeaders);

  headers.set("Accept", accept);
  headers.set("User-Agent", PRODUCT_NAME);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function githubRequest(
  path: string,
  options?: {
    accept?: string;
    accessToken?: string;
    disableCache?: boolean;
    forceFresh?: boolean;
    init?: RequestInit;
  },
) {
  const disableCache = options?.forceFresh || options?.disableCache;
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options?.init,
    cache: disableCache ? "no-store" : "force-cache",
    next: disableCache ? undefined : { revalidate: CACHE_WINDOW_SECONDS },
    headers: buildGitHubHeaders(
      options?.accept ?? "application/vnd.github+json",
      options?.init?.headers,
      options?.accessToken,
    ),
  });

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetUnix = response.headers.get("x-ratelimit-reset");
    if (remaining === "0" || response.status === 429) {
      const resetAt = resetUnix
        ? new Date(Number(resetUnix) * 1000).toISOString()
        : undefined;
      throw new GitHubFetchError(
        "rate_limited",
        "GitHub API 요청 한도에 도달했습니다.",
        { resetAt },
      );
    }
  }

  if (response.status === 404) {
    throw new GitHubFetchError(
      "not_found",
      "해당 GitHub 사용자를 찾을 수 없습니다.",
    );
  }

  if (!response.ok) {
    throw new GitHubFetchError(
      "api_error",
      "GitHub 데이터를 불러오는 중 오류가 발생했습니다.",
    );
  }

  return response;
}

async function githubJson<T>(
  path: string,
  options?: {
    accept?: string;
    accessToken?: string;
    disableCache?: boolean;
    forceFresh?: boolean;
    init?: RequestInit;
  },
) {
  const response = await githubRequest(path, options);
  return (await response.json()) as T;
}

function getNextGitHubPagePath(linkHeader: string | null) {
  if (!linkHeader) {
    return null;
  }

  const nextPart = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.includes('rel="next"'));

  if (!nextPart) {
    return null;
  }

  const match = nextPart.match(/<([^>]+)>/);
  if (!match?.[1]) {
    return null;
  }

  try {
    const url = new URL(match[1]);
    if (url.origin !== GITHUB_API_BASE) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

async function githubJsonPaginated<T>(
  path: string,
  options?: {
    accept?: string;
    accessToken?: string;
    disableCache?: boolean;
    forceFresh?: boolean;
    init?: RequestInit;
  },
) {
  const items: T[] = [];
  let nextPath: string | null = path;
  let pageCount = 0;

  while (nextPath && pageCount < MAX_GITHUB_PAGINATION_PAGES) {
    const response = await githubRequest(nextPath, options);
    const pageItems = (await response.json()) as T[];

    if (!Array.isArray(pageItems)) {
      throw new GitHubFetchError(
        "api_error",
        "GitHub pagination response was not an array.",
      );
    }

    items.push(...pageItems);
    nextPath = getNextGitHubPagePath(response.headers.get("link"));
    pageCount += 1;
  }

  return items;
}

async function fetchPinnedRepos(
  username: string,
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  const token = accessToken?.trim() || readEnv("GITHUB_TOKEN");
  if (!token) {
    return [];
  }

  const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
    method: "POST",
    cache: forceFresh || disableCache ? "no-store" : "force-cache",
    next:
      forceFresh || disableCache
        ? undefined
        : { revalidate: CACHE_WINDOW_SECONDS },
    headers: buildGitHubHeaders("application/json", {
      "Content-Type": "application/json",
    }, token),
    body: JSON.stringify({
      query: GRAPHQL_PINNED_QUERY,
      variables: { login: username },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as GitHubPinnedResponse;
  if (json.errors?.length || !json.data?.user) {
    return [];
  }

  return json.data.user.pinnedItems.nodes.map((repo) => ({
    name: repo.name,
    description: repo.description,
    homepageUrl: sanitizeExternalUrl(repo.homepageUrl ?? ""),
    stars: repo.stargazerCount,
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    updatedAt: repo.updatedAt,
    url: repo.url,
  }));
}

async function fetchViewerContributionSummary(
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  const token = accessToken?.trim() || readEnv("GITHUB_TOKEN");
  if (!token) {
    return null;
  }

  const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
    method: "POST",
    cache: forceFresh || disableCache ? "no-store" : "force-cache",
    next:
      forceFresh || disableCache
        ? undefined
        : { revalidate: CACHE_WINDOW_SECONDS },
    headers: buildGitHubHeaders(
      "application/json",
      {
        "Content-Type": "application/json",
      },
      token,
    ),
    body: JSON.stringify({
      query: GRAPHQL_VIEWER_CONTRIBUTIONS_QUERY,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as GitHubViewerContributionResponse;
  const contributions = json.data?.viewer?.contributionsCollection;
  if (json.errors?.length || !contributions) {
    return null;
  }

  return {
    endedAt: contributions.endedAt,
    startedAt: contributions.startedAt,
    totalCommitContributions: contributions.totalCommitContributions,
    totalContributions: contributions.contributionCalendar.totalContributions,
    totalIssueContributions: contributions.totalIssueContributions,
    totalPullRequestContributions: contributions.totalPullRequestContributions,
    totalPullRequestReviewContributions:
      contributions.totalPullRequestReviewContributions,
  } satisfies ContributionSummary;
}

function decodeReadme(readme: GitHubReadmeResponse | null) {
  if (!readme?.content) {
    return null;
  }

  if (readme.encoding !== "base64") {
    return null;
  }

  return Buffer.from(readme.content, "base64")
    .toString("utf-8")
    .replace(/\u0000/g, "")
    .trim();
}

function sanitizeReadme(readme: string | null) {
  if (!readme) {
    return null;
  }

  return readme
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 1600)
    .trim();
}

function sanitizeExternalUrl(url: string | null | undefined) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

async function fetchRepoReadme(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name">,
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  try {
    const json = await githubJson<GitHubReadmeResponse>(
      `/repos/${username}/${repo.name}/readme`,
      {
        accessToken,
        disableCache,
        forceFresh,
      },
    );

    return sanitizeReadme(decodeReadme(json));
  } catch {
    return null;
  }
}

async function fetchRepoRootFiles(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name" | "defaultBranch">,
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  try {
    const response = await githubJson<GitHubContentItemResponse[] | GitHubContentItemResponse>(
      `/repos/${username}/${repo.name}/contents?ref=${repo.defaultBranch}`,
      { accessToken, disableCache, forceFresh },
    );

    if (!Array.isArray(response)) {
      return [];
    }

    return response
      .map((item) => item.name)
      .filter(Boolean)
      .slice(0, 24);
  } catch {
    return [];
  }
}

async function fetchRepoRecentCommitMessages(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name" | "defaultBranch">,
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  try {
    const response = await githubJson<GitHubCommitResponse[]>(
      `/repos/${username}/${repo.name}/commits?per_page=20&sha=${repo.defaultBranch}`,
      { accessToken, disableCache, forceFresh },
    );

    return response
      .map((item) => item.commit?.message?.trim())
      .filter((message): message is string => Boolean(message))
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchRepoFileContent(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name" | "defaultBranch">,
  filePath: string,
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  try {
    const response = await githubJson<GitHubReadmeResponse>(
      `/repos/${username}/${repo.name}/contents/${encodeURIComponent(filePath)}?ref=${repo.defaultBranch}`,
      { accessToken, disableCache, forceFresh },
    );

    return sanitizeReadme(decodeReadme(response));
  } catch {
    return null;
  }
}

function getRepoManifestTargets(rootFiles: string[]) {
  return rootFiles
    .filter((file) => ROOT_MANIFEST_FILE_NAMES.includes(file))
    .slice(0, MANIFEST_CONTENT_LIMIT);
}

async function fetchRepoManifestContents(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name" | "defaultBranch">,
  rootFiles: string[],
  forceFresh?: boolean,
  accessToken?: string,
  disableCache?: boolean,
) {
  const targets = getRepoManifestTargets(rootFiles);
  if (targets.length === 0) {
    return [];
  }

  const contents = await Promise.all(
    targets.map(async (target) =>
      fetchRepoFileContent(
        username,
        repo,
        target,
        forceFresh,
        accessToken,
        disableCache,
      ),
    ),
  );

  return contents.filter((content): content is string => Boolean(content));
}

function recencyScore(updatedAt: string) {
  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (diffDays <= 30) return 20;
  if (diffDays <= 90) return 14;
  if (diffDays <= 180) return 8;
  if (diffDays <= 365) return 4;
  return 0;
}

function readmeScore(readme: string | null) {
  if (!readme) return 0;
  if (readme.length >= 1400) return 14;
  if (readme.length >= 700) return 10;
  if (readme.length >= 250) return 6;
  return 3;
}

function buildTechSignals(repo: {
  description: string | null;
  identity?: RepoIdentity;
  language: string | null;
  manifestContents?: string[];
  readme: string | null;
  rootFiles?: string[];
  topics: string[];
}) {
  const signals = new Set<string>();
  const addSignal = (label: string) =>
    signals.add(
      normalizeRepoDisplayLabel(
        {
          description: repo.description,
          githubLanguage: repo.language,
          identity: repo.identity,
          manifestContents: repo.manifestContents,
          name: "",
          readme: repo.readme,
          recentCommitMessages: [],
          rootFiles: repo.rootFiles ?? [],
          topics: repo.topics,
        },
        label,
        repo.identity,
      ),
    );

  if (repo.language) {
    addSignal(repo.language);
  }

  repo.topics.slice(0, 5).forEach((topic) => addSignal(topic));

  repo.identity?.frameworks.forEach((item) => addSignal(item.label));
  repo.identity?.domains.forEach((item) => addSignal(item.label));

  (repo.manifestContents ?? []).forEach((content) => {
    const normalized = content.toLowerCase();
    [
      ["next", "Next.js"],
      ["react", "React"],
      ["vite", "Vite"],
      ["tailwind", "Tailwind CSS"],
      ["fastapi", "FastAPI"],
      ["django", "Django"],
      ["gin", "Gin"],
      ["clap", "clap"],
    ].forEach(([keyword, label]) => {
      if (normalized.includes(keyword)) {
        addSignal(label);
      }
    });
  });

  if (repo.readme) {
    const lowercaseReadme = repo.readme.toLowerCase();
    ["next.js", "react", "typescript", "tailwind", "node", "docker"].forEach(
      (keyword) => {
        if (lowercaseReadme.includes(keyword)) {
          addSignal(keyword);
        }
      },
    );
  }

  (repo.rootFiles ?? []).forEach((file) => {
    const normalized = file.toLowerCase();
    if (normalized.includes("next.config")) {
      addSignal("Next.js");
    }
    if (normalized.includes("tailwind.config")) {
      addSignal("Tailwind CSS");
    }
    if (normalized === "dockerfile" || normalized.includes("docker-compose")) {
      addSignal("Docker");
    }
    if (normalized.includes("playwright")) {
      addSignal("Playwright");
    }
  });

  if (repo.description) {
    const lowercaseDescription = repo.description.toLowerCase();
    const descriptionKeywords = new Map([
      ["openai", "OpenAI"],
      ["llm", "LLM"],
      ["rag", "RAG"],
      ["agent", "agent"],
    ]);
    descriptionKeywords.forEach((label, keyword) => {
      if (lowercaseDescription.includes(keyword)) {
        addSignal(label);
      }
    });
  }

  return [...signals].slice(0, 6);
}

function normalizedRepoText(repo: GitHubRepoSnapshot) {
  return [
    repo.description ?? "",
    repo.readme ?? "",
    repo.topics.join(" "),
    repo.rootFiles.join(" "),
    repo.recentCommitMessages.join(" "),
    (repo.manifestContents ?? []).join(" "),
    repo.techSignals.join(" "),
  ]
    .join("\n")
    .toLowerCase();
}

function hasDocumentationSignal(repo: GitHubRepoSnapshot) {
  return (
    (repo.readme?.length ?? 0) >= 250 ||
    repo.rootFiles.some((file) => file.toLowerCase() === "docs") ||
    repo.topics.some((topic) => {
      const normalized = topic.toLowerCase();
      return normalized === "docs" || normalized === "documentation";
    }) ||
    repo.identity?.surfaces.some((item) => item.label === "docs") === true
  );
}

function hasVerificationSignal(repo: GitHubRepoSnapshot) {
  const text = normalizedRepoText(repo);
  return (
    repo.rootFiles.some((file) =>
      /playwright|vitest|jest|cypress|pytest|spec|test/i.test(file),
    ) ||
    repo.techSignals.some((signal) =>
      ["Playwright", "Vitest", "Jest", "Cypress", "pytest"].includes(signal),
    ) ||
    /(^|[^a-z])(test|tests|testing|e2e|vitest|jest|playwright|cypress|pytest|coverage)(?=$|[^a-z])/i.test(
      text,
    )
  );
}

function hasAutomationSignal(repo: GitHubRepoSnapshot) {
  const text = normalizedRepoText(repo);
  return (
    repo.rootFiles.some((file) => file === ".github") ||
    repo.identity?.domains.some((item) => item.label === "Automation") === true ||
    /(^|[^a-z])(workflow|workflows|deploy|deployment|ci|cd|actions)(?=$|[^a-z])/i.test(
      text,
    )
  );
}

function repoIdentitySignalScore(repo: GitHubRepoSnapshot) {
  const identity = repo.identity;
  if (!identity) {
    return 0;
  }

  return (
    identity.confidence * 16 +
    Math.min(identity.frameworks.length * 1.8, 5.4) +
    Math.min(identity.domains.length * 1.4, 2.8) +
    Math.min(identity.surfaces.length * 1.7, 3.4)
  );
}

function scoreReadmeCandidate(repo: GitHubRepoSnapshot) {
  return (
    recencyScore(repo.updatedAt) +
    (repo.description ? 8 : 0) +
    Math.min(repo.topics.length * 1.4, 7) +
    (repo.language ? 3 : 0) +
    Math.min(repo.size / 500, 4) +
    (repo.visibility === "private" ? 4 : 0) +
    (repo.isFork ? -8 : 0) +
    (repo.archived ? -20 : 0)
  );
}

function scorePrivateShowcaseRepo(repo: GitHubRepoSnapshot) {
  return (
    recencyScore(repo.updatedAt) * 1.1 +
    readmeScore(repo.readme) * 1.3 +
    repoIdentitySignalScore(repo) +
    (repo.description ? 8 : 0) +
    Math.min(repo.topics.length * 1.4, 7) +
    (repo.homepageUrl ? 3 : 0) +
    (repo.rootFiles.length > 0 ? 4 : 0) +
    (repo.recentCommitMessages.length > 0 ? 2 : 0) +
    (repo.isFork ? -10 : 0) +
    (repo.archived ? -20 : 0)
  );
}

function scoreRepo(repo: GitHubRepoSnapshot, dataMode: DataMode) {
  const privateContextBoost =
    dataMode === "private_enriched" && repo.visibility === "private"
      ? 10 +
        (repo.readme ? 4 : 0) +
        Math.min(repo.topics.length * 0.7, 3.5) +
        (repo.description ? 2 : 0)
      : 0;

  return (
    Math.min(repo.stars * 3, 30) +
    recencyScore(repo.updatedAt) +
    readmeScore(repo.readme) +
    repoIdentitySignalScore(repo) +
    (repo.isPinned ? 18 : 0) +
    (repo.description ? 8 : 0) +
    (repo.homepageUrl ? 4 : 0) +
    Math.min(repo.topics.length * 1.2, 6) +
    (repo.language ? 3 : 0) +
    privateContextBoost +
    (repo.isFork ? -12 : 0) +
    (repo.archived ? -20 : 0)
  );
}

function sortByUpdatedAtDesc(
  left: Pick<GitHubRepoSnapshot, "score" | "updatedAt">,
  right: Pick<GitHubRepoSnapshot, "score" | "updatedAt">,
) {
  return (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() ||
    right.score - left.score
  );
}

function dedupeRepos(
  groups: GitHubRepoSnapshot[][],
  limit: number,
) {
  const pool = new Map<string, GitHubRepoSnapshot>();

  groups.forEach((group) => {
    group.forEach((repo) => {
      if (!pool.has(repo.name.toLowerCase())) {
        pool.set(repo.name.toLowerCase(), repo);
      }
    });
  });

  return [...pool.values()].slice(0, limit);
}

function scoreRecentShowcaseRepo(repo: GitHubRepoSnapshot) {
  return (
    recencyScore(repo.updatedAt) * 1.7 +
    readmeScore(repo.readme) +
    repoIdentitySignalScore(repo) +
    (repo.description ? 6 : 0) +
    Math.min(repo.topics.length * 1.2, 5) +
    (repo.homepageUrl ? 2 : 0) +
    (repo.rootFiles.length > 0 ? 3 : 0) +
    (repo.recentCommitMessages.length > 0 ? 2 : 0) +
    (repo.isFork ? -10 : 0) +
    (repo.archived ? -20 : 0)
  );
}

function buildSignalRepoPool(
  repos: GitHubRepoSnapshot[],
  pinnedRepos: Array<{ name: string }>,
  dataMode: DataMode,
) {
  const allowedRepos = repos.filter(
    (repo) => !repo.archived && (dataMode === "private_enriched" || repo.visibility === "public"),
  );
  const allowedRepoMap = new Map(
    allowedRepos.map((repo) => [repo.name.toLowerCase(), repo] as const),
  );
  const pinnedCandidates = pinnedRepos
    .map((repo) => allowedRepoMap.get(repo.name.toLowerCase()))
    .filter((repo): repo is GitHubRepoSnapshot => Boolean(repo));
  const topScored = [...allowedRepos]
    .sort((left, right) => right.score - left.score)
    .slice(0, SIGNAL_REPO_LIMIT);
  const recent = [...allowedRepos]
    .sort(sortByUpdatedAtDesc)
    .slice(0, SIGNAL_REPO_LIMIT);
  const documented = [...allowedRepos]
    .filter((repo) => repo.readme || repo.description || repo.topics.length > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, SIGNAL_REPO_LIMIT);

  return dedupeRepos(
    [pinnedCandidates, topScored, recent, documented],
    SIGNAL_REPO_LIMIT,
  );
}

function buildPublicShowcaseRepos(
  repos: GitHubRepoSnapshot[],
  pinnedRepos: Array<{ name: string }>,
) {
  const publicRepos = repos.filter(
    (repo) => !repo.archived && repo.visibility === "public",
  );
  const publicRepoMap = new Map(
    publicRepos.map((repo) => [repo.name.toLowerCase(), repo] as const),
  );
  const pinnedCandidates = pinnedRepos
    .map((repo) => publicRepoMap.get(repo.name.toLowerCase()))
    .filter((repo): repo is GitHubRepoSnapshot => Boolean(repo));
  const fallback = publicRepos
    .filter((repo) => !repo.isPinned)
    .sort((left, right) => right.score - left.score || sortByUpdatedAtDesc(left, right))
    .slice(0, REPRESENTATIVE_REPO_LIMIT);

  return dedupeRepos(
    [pinnedCandidates, fallback],
    REPRESENTATIVE_REPO_LIMIT,
  );
}

function buildRecentShowcaseRepos(
  repos: GitHubRepoSnapshot[],
  privateExposureMode: PrivateExposureMode,
) {
  const allowedRepos = repos.filter(
    (repo) =>
      !repo.archived &&
      (privateExposureMode === "include" || repo.visibility === "public"),
  );

  return [...allowedRepos]
    .sort(
      (left, right) =>
        scoreRecentShowcaseRepo(right) - scoreRecentShowcaseRepo(left) ||
        sortByUpdatedAtDesc(left, right),
    )
    .slice(0, REPRESENTATIVE_REPO_LIMIT);
}

function formatActivityNote(
  locale: Locale,
  lastActiveAt: string | null,
  recentRepoCount: number,
) {
  if (!lastActiveAt) {
    return locale === "ko"
      ? "공개 저장소 활동이 많지 않아 최근 작업 패턴을 파악하기 어렵습니다."
      : "There are not many public repository activity signals, so recent working patterns are hard to read.";
  }

  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (recentRepoCount >= 5 && diffDays <= 30) {
    return locale === "ko"
      ? "최근 한 달 안에도 여러 저장소가 갱신되어 활동성이 꾸준히 보입니다."
      : "Several repositories have been updated within the past month, suggesting steady activity.";
  }
  if (recentRepoCount >= 2 && diffDays <= 90) {
    return locale === "ko"
      ? "최근 분기 안에서 반복적으로 저장소를 업데이트한 흐름이 보입니다."
      : "There is a recurring pattern of repository updates within the past quarter.";
  }
  if (diffDays <= 180) {
    return locale === "ko"
      ? "최근 반년 안의 업데이트가 확인되며 간헐적으로 작업을 이어가는 편으로 보입니다."
      : "Updates within the past six months are visible, suggesting occasional but continued work.";
  }
  return locale === "ko"
    ? "최근 공개 활동은 다소 이전 시점에 머물러 있어 현재 작업 흐름은 제한적으로만 보입니다."
    : "Recent public activity is older, so current working patterns are only partially visible.";
}

function getRepoPoolForReadmes(
  repos: GitHubRepoSnapshot[],
  usePrivateRepoScope = false,
) {
  const pool = new Map<string, GitHubRepoSnapshot>();
  const candidateLimit = getReadmeCandidateLimit(usePrivateRepoScope);

  repos
    .filter((repo) => !repo.archived)
    .sort((left, right) => right.stars - left.stars)
    .slice(0, candidateLimit)
    .forEach((repo) => pool.set(repo.name, repo));

  repos
    .filter((repo) => !repo.archived)
    .slice(0, candidateLimit)
    .forEach((repo) => pool.set(repo.name, repo));

  repos
    .filter((repo) => !repo.archived)
    .sort(
      (left, right) => scoreReadmeCandidate(right) - scoreReadmeCandidate(left),
    )
    .slice(0, candidateLimit)
    .forEach((repo) => pool.set(repo.name, repo));

  repos
    .filter((repo) => repo.isPinned)
    .forEach((repo) => pool.set(repo.name, repo));

  return [...pool.values()].slice(0, candidateLimit);
}

function buildTopLanguages(repos: GitHubRepoSnapshot[]) {
  const languageMap = new Map<string, { repoCount: number; score: number }>();

  repos
    .filter((repo) => !repo.archived)
    .forEach((repo) => {
      const rankedLanguages = buildRepoDisplayLanguages({
        description: repo.description,
        githubLanguage: repo.language,
        identity: repo.identity,
        manifestContents: repo.manifestContents,
        name: repo.name,
        readme: repo.readme,
        recentCommitMessages: repo.recentCommitMessages,
        rootFiles: repo.rootFiles,
        topics: repo.topics,
      });

      rankedLanguages.slice(0, 2).forEach((language, index) => {
        const existing = languageMap.get(language.label) ?? { repoCount: 0, score: 0 };
        existing.repoCount += index === 0 ? 1 : 0;
        existing.score +=
          language.score * 0.8 +
          4 +
          Math.min(repo.stars, 20) * 0.6 +
          (repo.isPinned ? 2 : 0);
        languageMap.set(language.label, existing);
      });
    });

  return [...languageMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function rankIdentityLabels(
  repos: GitHubRepoSnapshot[],
  pick: (repo: GitHubRepoSnapshot) => Array<{ label: string; score: number }>,
  limit: number,
) {
  const scores = new Map<string, number>();

  repos
    .filter((repo) => !repo.archived)
    .forEach((repo) => {
      const weight =
        1 +
        Math.min(repo.score, 100) * 0.004 +
        (repo.readme ? 0.18 : 0) +
        (repo.visibility === "private" ? 0.08 : 0);

      pick(repo)
        .slice(0, 2)
        .forEach((entry, index) => {
          scores.set(
            entry.label,
            (scores.get(entry.label) ?? 0) +
              entry.score * weight * (index === 0 ? 1 : 0.8),
          );
        });
    });

  return [...scores.entries()]
    .map(([label, score]) => ({ label, score }))
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, limit)
    .map((item) => item.label);
}

function formatPrivateSurfaceLabel(label: string, locale: Locale) {
  if (locale === "ko") {
    if (label === "frontend") return "프론트엔드";
    if (label === "backend") return "백엔드";
    if (label === "mobile") return "모바일";
    if (label === "devtools") return "개발툴";
    if (label === "docs") return "문서";
  }

  if (label === "devtools") {
    return locale === "ko" ? "개발툴" : "developer tooling";
  }
  if (label === "docs") {
    return locale === "ko" ? "문서" : "documentation";
  }
  if (label === "Automation") {
    return locale === "ko" ? "자동화" : "automation";
  }

  return label;
}

function buildPrivateShowcaseReason(
  repo: GitHubRepoSnapshot,
  locale: Locale,
) {
  const signals: string[] = [];
  const topFramework = repo.identity?.frameworks[0]?.label;
  const topSurface = repo.identity?.surfaces[0]?.label;

  if (topFramework) {
    signals.push(
      locale === "ko"
        ? `${topFramework} 중심 신호가 비교적 선명합니다.`
        : `${topFramework} signals are comparatively clear.`,
    );
  }
  if (topSurface) {
    signals.push(
      locale === "ko"
        ? `${formatPrivateSurfaceLabel(topSurface, locale)} 성격이 드러납니다.`
        : `It reads clearly as ${formatPrivateSurfaceLabel(topSurface, locale)} work.`,
    );
  }
  if (hasVerificationSignal(repo)) {
    signals.push(
      locale === "ko"
        ? "테스트나 검증 흔적이 보입니다."
        : "Testing or verification traces are visible.",
    );
  }
  if (hasAutomationSignal(repo)) {
    signals.push(
      locale === "ko"
        ? "자동화나 배포 관련 단서가 보입니다."
        : "Automation or deployment clues are visible.",
    );
  }
  if (hasDocumentationSignal(repo)) {
    signals.push(
      locale === "ko"
        ? "README나 문서 흔적이 비교적 남아 있습니다."
        : "README or documentation traces are relatively visible.",
    );
  }

  if (signals.length === 0) {
    return locale === "ko"
      ? "최근 작업 흐름과 저장소 구조를 기준으로 private 쪽에서 의미 있는 후보로 읽힙니다."
      : "Recent activity and repository structure make this a meaningful private-side highlight.";
  }

  return signals.slice(0, 2).join(" ");
}

function buildPrivateShowcaseRepos(
  privateRepos: GitHubRepoSnapshot[],
  locale: Locale,
) {
  return privateRepos
    .filter((repo) => !repo.archived)
    .sort(
      (left, right) =>
        scorePrivateShowcaseRepo(right) - scorePrivateShowcaseRepo(left),
    )
    .slice(0, PRIVATE_SHOWCASE_LIMIT)
    .map((repo) => ({
      description:
        repo.description ??
        (locale === "ko"
          ? "설명이 짧아 기술 스택과 구조 단서 중심으로 해석했습니다."
          : "The description is limited, so this reading relies mostly on stack and structural clues."),
      name: repo.name,
      repoUrl: repo.repoUrl,
      tech: buildRepoTechStack({
        description: repo.description,
        githubLanguage: repo.language,
        identity: repo.identity,
        manifestContents: repo.manifestContents,
        name: repo.name,
        readme: repo.readme,
        recentCommitMessages: repo.recentCommitMessages,
        rootFiles: repo.rootFiles,
        topics: repo.topics,
      }).slice(0, 4),
      updatedAt: repo.updatedAt,
      whyItStandsOut: buildPrivateShowcaseReason(repo, locale),
    }) satisfies AuthorizedPrivateRepoHighlight);
}

function buildAuthorizedPrivateInsights(
  repos: GitHubRepoSnapshot[],
  hiddenRepresentativeCount: number,
  locale: Locale,
) {
  const privateRepos = repos.filter((repo) => repo.visibility === "private");
  if (privateRepos.length === 0) {
    return null;
  }

  const publicRepos = repos.filter((repo) => repo.visibility === "public");
  const privateStackSummary = summarizeRepoStack(privateRepos);
  const publicStackSummary =
    publicRepos.length > 0 ? summarizeRepoStack(publicRepos) : null;
  const publicStackSet = new Set(
    (publicStackSummary?.coreStack ?? []).map((item) => item.toLowerCase()),
  );

  return {
    authorizedRepoCount: repos.length,
    automatedPrivateRepoCount: privateRepos.filter(hasAutomationSignal).length,
    documentedPrivateRepoCount: privateRepos.filter(hasDocumentationSignal).length,
    hiddenRepresentativeCount,
    privateRepoCount: privateRepos.length,
    privateOnlyStack: privateStackSummary.coreStack
      .filter((item) => !publicStackSet.has(item.toLowerCase()))
      .slice(0, 4),
    privateShowcaseRepos: buildPrivateShowcaseRepos(privateRepos, locale),
    recentPrivateRepoCount: privateRepos.filter(
      (repo) => recencyScore(repo.updatedAt) >= 8,
    ).length,
    topPrivateDomains: rankIdentityLabels(
      privateRepos,
      (repo) => repo.identity?.domains ?? [],
      3,
    ),
    topPrivateStack:
      privateStackSummary.coreStack.length > 0
        ? privateStackSummary.coreStack.slice(0, 4)
        : buildTopLanguages(privateRepos)
            .map((item) => item.name)
            .slice(0, 4),
    topPrivateSurfaces: privateStackSummary.topSurfaces.slice(0, 3),
    verifiedPrivateRepoCount: privateRepos.filter(hasVerificationSignal).length,
  } satisfies AuthorizedPrivateInsights;
}

function formatLocaleNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(
    value,
  );
}

function buildEvidenceSignals(
  locale: Locale,
  source: Pick<
    GitHubSourceData,
    | "account"
    | "activity"
    | "authorizedPrivateInsights"
    | "dataMode"
    | "privateExposureMode"
    | "representativeRepos"
    | "stackSummary"
    | "topLanguages"
  >,
) {
  const signals: string[] = [];

  if (source.dataMode === "private_enriched") {
    signals.push(
      locale === "ko"
        ? "로그인한 본인 계정 기준으로 승인된 GitHub 데이터 범위까지 함께 읽었습니다."
        : "This reading includes GitHub data authorized by the signed-in account, which may include private repositories.",
    );
  }

  if (
    source.dataMode === "private_enriched" &&
    source.authorizedPrivateInsights?.privateRepoCount
  ) {
    signals.push(
      source.privateExposureMode === "include"
        ? locale === "ko"
          ? `승인된 비공개 저장소 ${formatLocaleNumber(source.authorizedPrivateInsights.privateRepoCount, locale)}개까지 결과 문서에 직접 포함할 수 있도록 열어 두었습니다.`
          : `${formatLocaleNumber(source.authorizedPrivateInsights.privateRepoCount, locale)} authorized private repositories are available for direct inclusion in this document.`
        : locale === "ko"
          ? `승인된 비공개 저장소 ${formatLocaleNumber(source.authorizedPrivateInsights.privateRepoCount, locale)}개를 분석에 반영했지만, 기본 공유 모드에서는 상세를 숨깁니다.`
          : `${formatLocaleNumber(source.authorizedPrivateInsights.privateRepoCount, locale)} authorized private repositories inform the analysis, while details stay hidden in the default sharing mode.`,
    );
  }

  if (
    source.dataMode === "private_enriched" &&
    source.authorizedPrivateInsights?.privateOnlyStack.length
  ) {
    signals.push(
      locale === "ko"
        ? `비공개 저장소를 함께 보면 공개 결과에 덜 드러나던 ${source.authorizedPrivateInsights.privateOnlyStack
            .slice(0, 3)
            .join(", ")} 같은 스택이 추가로 보입니다.`
        : `Including private repositories reveals additional stack signals such as ${source.authorizedPrivateInsights.privateOnlyStack
            .slice(0, 3)
            .join(", ")} that are less visible in public work.`,
    );
  } else if (
    source.dataMode === "private_enriched" &&
    source.authorizedPrivateInsights?.topPrivateSurfaces.length
  ) {
    signals.push(
      locale === "ko"
        ? `비공개 쪽에서는 ${source.authorizedPrivateInsights.topPrivateSurfaces
            .slice(0, 2)
            .map((item) => formatPrivateSurfaceLabel(item, locale))
            .join(", ")} 성격이 조금 더 선명하게 드러납니다.`
        : `Private work makes ${source.authorizedPrivateInsights.topPrivateSurfaces
            .slice(0, 2)
            .map((item) => formatPrivateSurfaceLabel(item, locale))
            .join(", ")} surfaces a bit clearer.`,
    );
  }

  if (
    source.dataMode === "private_enriched" &&
    source.authorizedPrivateInsights &&
    (source.authorizedPrivateInsights.documentedPrivateRepoCount > 0 ||
      source.authorizedPrivateInsights.verifiedPrivateRepoCount > 0 ||
      source.authorizedPrivateInsights.automatedPrivateRepoCount > 0)
  ) {
    signals.push(
      locale === "ko"
        ? `비공개 저장소 기준으로 문서 흔적 ${formatLocaleNumber(source.authorizedPrivateInsights.documentedPrivateRepoCount, locale)}개, 검증 흔적 ${formatLocaleNumber(source.authorizedPrivateInsights.verifiedPrivateRepoCount, locale)}개, 자동화 흔적 ${formatLocaleNumber(source.authorizedPrivateInsights.automatedPrivateRepoCount, locale)}개가 보수적으로 확인됩니다.`
        : `Across private repositories, ${formatLocaleNumber(source.authorizedPrivateInsights.documentedPrivateRepoCount, locale)} show documentation traces, ${formatLocaleNumber(source.authorizedPrivateInsights.verifiedPrivateRepoCount, locale)} show validation traces, and ${formatLocaleNumber(source.authorizedPrivateInsights.automatedPrivateRepoCount, locale)} show automation traces by conservative reading.`,
    );
  }

  if (
    source.dataMode === "private_enriched" &&
    source.activity.contributionSummary
  ) {
    signals.push(
      locale === "ko"
        ? `최근 1년 기준 승인된 활동에서 총 ${formatLocaleNumber(source.activity.contributionSummary.totalContributions, locale)}건의 기여와 ${formatLocaleNumber(source.activity.contributionSummary.totalPullRequestContributions, locale)}건의 pull request가 확인됩니다.`
        : `Within the authorized activity window, the past year shows ${formatLocaleNumber(source.activity.contributionSummary.totalContributions, locale)} contributions and ${formatLocaleNumber(source.activity.contributionSummary.totalPullRequestContributions, locale)} pull requests.`,
    );
  }

  if ((source.stackSummary?.coreStack.length ?? 0) > 0) {
    signals.push(
      locale === "ko"
        ? `핵심 스택은 ${source.stackSummary!.coreStack
            .slice(0, 3)
            .join(", ")} 순으로 나타났습니다.`
        : `The clearest stack signals appear in the order of ${source.stackSummary!.coreStack
            .slice(0, 3)
            .join(", ")}.`,
    );
  } else if (source.topLanguages.length > 0) {
    signals.push(
      locale === "ko"
        ? `주요 언어는 ${source.topLanguages
            .slice(0, 3)
            .map((item) => item.name)
            .join(", ")} 순으로 나타났습니다.`
        : `Top languages appear in the order of ${source.topLanguages
            .slice(0, 3)
            .map((item) => item.name)
            .join(", ")}.`,
    );
  }

  if (source.representativeRepos.some((repo) => repo.readme && repo.readme.length > 500)) {
    signals.push(
      locale === "ko"
        ? "대표 저장소 중 README가 비교적 충실한 프로젝트가 확인됩니다."
        : "At least one standout repository has a relatively detailed README.",
    );
  }

  if (source.representativeRepos.some((repo) => repo.homepageUrl)) {
    signals.push(
      locale === "ko"
        ? "대표 프로젝트 중 실행해 볼 수 있는 데모나 외부 링크가 연결된 사례가 있습니다."
        : "Some standout projects include a runnable demo or an external product link.",
    );
  }

  signals.push(source.activity.note);
  signals.push(
    source.dataMode === "private_enriched" &&
      source.authorizedPrivateInsights?.privateRepoCount
      ? locale === "ko"
        ? `공개 저장소는 ${source.account.publicRepoCount}개이고, 승인된 범위에서 읽은 전체 소유 저장소는 ${formatLocaleNumber(source.authorizedPrivateInsights.authorizedRepoCount, locale)}개입니다.`
        : `The account exposes ${source.account.publicRepoCount} public repositories, while ${formatLocaleNumber(source.authorizedPrivateInsights.authorizedRepoCount, locale)} owned repositories were readable within the authorized scope.`
      : locale === "ko"
        ? `공개 저장소 수는 ${source.account.publicRepoCount}개, 팔로워 수는 ${source.account.followers}명입니다.`
        : `The account has ${source.account.publicRepoCount} public repositories and ${source.account.followers} followers.`,
  );

  return signals.slice(0, 5);
}

function buildMockSource(
  locale: Locale,
  overrides?: Partial<GitHubSourceData["account"]> & { cacheKeySuffix?: string },
): GitHubSourceData {
  const account = {
    ...mockGitHubProfile.account,
    ...overrides,
  };
  const activity = {
    ...mockGitHubProfile.activity,
    note: formatActivityNote(
      locale,
      mockGitHubProfile.activity.lastActiveAt,
      mockGitHubProfile.activity.recentRepoCount,
    ),
  };
  const source: GitHubSourceData = {
    ...mockGitHubProfile,
    account,
    activity,
    authorizedPrivateInsights: null,
    cacheKey: `${mockGitHubProfile.cacheKey}::${overrides?.cacheKeySuffix ?? "fixture"}`,
    dataMode: "public",
    privateExposureMode: "aggregate",
    signalRepos: mockGitHubProfile.repos.slice(0, SIGNAL_REPO_LIMIT),
    stackSummary: summarizeRepoStack(
      mockGitHubProfile.repos.slice(0, SIGNAL_REPO_LIMIT),
    ),
  };

  return {
    ...source,
    evidenceSignals: buildEvidenceSignals(locale, {
      account: source.account,
      activity: source.activity,
      authorizedPrivateInsights: source.authorizedPrivateInsights,
      dataMode: source.dataMode,
      privateExposureMode: source.privateExposureMode,
      representativeRepos: source.representativeRepos,
      stackSummary: source.stackSummary,
      topLanguages: source.topLanguages,
    }),
  };
}

function buildDevelopmentFallbackSource(
  username: string,
  locale: Locale,
): GitHubSourceData {
  return {
    account: {
      avatarUrl: `https://github.com/${username}.png`,
      bio:
        locale === "ko"
          ? "로컬 개발 환경에서 GitHub API rate limit으로 인해 최소 정보만으로 문서를 렌더링했습니다."
          : "This document was rendered from a minimal local fallback because GitHub API rate limits were hit in development.",
      blogUrl: null,
      company: null,
      createdAt: new Date(0).toISOString(),
      email: null,
      followers: 0,
      following: 0,
      location: null,
      name: username,
      profileUrl: `https://github.com/${username}`,
      publicGistCount: 0,
      publicRepoCount: 0,
      twitterUsername: null,
      type: "User",
      updatedAt: new Date().toISOString(),
      username,
    },
    activity: {
      lastActiveAt: null,
      note:
        locale === "ko"
          ? "로컬 개발 환경에서 GitHub API 요청 한도에 걸려, 최근 활동은 실제 데이터 대신 최소 정보로만 표시됩니다."
          : "GitHub API rate limits were hit in local development, so recent activity is shown only from a minimal fallback source.",
      recentRepoCount: 0,
    },
    authorizedPrivateInsights: null,
    cacheKey: `local-dev-fallback::${username.toLowerCase()}`,
    dataMode: "public",
    evidenceSignals: [
      locale === "ko"
        ? "이 결과는 로컬 개발 편의를 위한 최소 fallback 문서입니다."
        : "This result is a minimal fallback document for local development.",
      locale === "ko"
        ? "실제 GitHub 해석을 보려면 GITHUB_TOKEN을 설정하거나 잠시 후 다시 시도해 주세요."
        : "To see real GitHub interpretation, set GITHUB_TOKEN or retry after the rate limit resets.",
    ],
    pinnedRepoNames: [],
    privateExposureMode: "aggregate",
    representativeRepos: [],
    repos: [],
    signalRepos: [],
    stackSummary: {
      averageConfidence: 0,
      coreStack: [],
      topLanguages: [],
      topSurfaces: [],
    },
    topLanguages: [],
  };
}

async function fetchGitHubSourceInternal(
  username: string,
  locale: Locale,
  forceFresh?: boolean,
  authContext?: GitHubSourceAuthContext,
  privateExposureMode: PrivateExposureMode = "aggregate",
): Promise<GitHubSourceData> {
  const useFixture =
    process.env.NODE_ENV !== "production" &&
    readEnv("GITHUBPRINT_USE_FIXTURE", "GITFOLIO_USE_FIXTURE") === "1";

  const isSignedInViewer = Boolean(
    authContext &&
      authContext.viewerUsername.toLowerCase() === username.toLowerCase(),
  );
  const dataMode: DataMode = isSignedInViewer ? "private_enriched" : "public";
  const usePrivateRepoScope = Boolean(
    isSignedInViewer &&
      authContext?.scopes.some(
        (scope) => scope === "repo" || scope === "public_repo",
      ),
  );
  const authAccessToken = isSignedInViewer ? authContext?.accessToken : undefined;
  const disableCache = Boolean(isSignedInViewer);

  if (useFixture) {
    return buildMockSource(locale);
  }

  try {
    const user = await githubJson<GitHubUserResponse>(
      isSignedInViewer ? "/user" : `/users/${username}`,
      {
        accessToken: authAccessToken,
        disableCache,
        forceFresh,
      },
    );

    if (user.type === "Organization") {
      throw new GitHubFetchError(
        "organization",
        "조직 계정은 아직 개인 개발자 문서 형식으로 분석하지 않습니다.",
      );
    }

    const reposResponse = await githubJsonPaginated<GitHubRepoResponse>(
      usePrivateRepoScope
        ? "/user/repos?per_page=100&sort=updated&direction=desc&visibility=all&affiliation=owner"
        : `/users/${username}/repos?per_page=100&sort=updated&direction=desc&type=owner`,
      {
        accessToken: authAccessToken,
        disableCache,
        forceFresh,
      },
    );

    const [pinnedRepos, contributionSummary] = await Promise.all([
      fetchPinnedRepos(
        username,
        forceFresh,
        authAccessToken,
        disableCache,
      ),
      isSignedInViewer
        ? fetchViewerContributionSummary(
            forceFresh,
            authAccessToken,
            disableCache,
          )
        : Promise.resolve(null),
    ]);
    const pinnedNames = new Set(pinnedRepos.map((repo) => repo.name.toLowerCase()));

    const repos: GitHubRepoSnapshot[] = reposResponse.map((repo) => ({
      archived: repo.archived,
      defaultBranch: repo.default_branch,
      description: repo.description,
      forks: repo.forks_count,
      homepageUrl: sanitizeExternalUrl(repo.homepage ?? ""),
      identity: undefined,
      isFork: repo.fork,
      isPinned: pinnedNames.has(repo.name.toLowerCase()),
      language: repo.language,
      manifestContents: [],
      name: repo.name,
      openIssuesCount: repo.open_issues_count,
      pushedAt: repo.pushed_at,
      readme: null,
      recentCommitMessages: [],
      repoUrl: repo.html_url,
      rootFiles: [],
      score: 0,
      size: repo.size,
      stars: repo.stargazers_count,
      techSignals: [],
      topics: repo.topics ?? [],
      updatedAt: repo.updated_at,
      visibility: repo.private ? "private" : "public",
    }));

    const readmeTargetRepos = getRepoPoolForReadmes(repos, usePrivateRepoScope);
    const readmes = await Promise.all(
      readmeTargetRepos.map(async (repo) => [
        repo.name,
        await fetchRepoReadme(
          username,
          repo,
          forceFresh,
          authAccessToken,
          disableCache,
        ),
      ] as const),
    );

    const readmeMap = new Map(readmes);
    const reposWithSignals = repos.map((repo) => {
      const pinnedFromGraph = pinnedRepos.find(
        (pinnedRepo) => pinnedRepo.name.toLowerCase() === repo.name.toLowerCase(),
      );

      const mergedRepo: GitHubRepoSnapshot = {
        ...repo,
        description: repo.description ?? pinnedFromGraph?.description ?? null,
        homepageUrl: sanitizeExternalUrl(
          repo.homepageUrl || pinnedFromGraph?.homepageUrl || "",
        ),
        readme: readmeMap.get(repo.name) ?? null,
        topics:
          repo.topics.length > 0
            ? repo.topics
            : (pinnedFromGraph?.topics ?? []).slice(0, 8),
      };

      const identity = inferRepoIdentity({
        description: mergedRepo.description,
        githubLanguage: mergedRepo.language,
        manifestContents: mergedRepo.manifestContents ?? [],
        name: mergedRepo.name,
        readme: mergedRepo.readme,
        recentCommitMessages: mergedRepo.recentCommitMessages,
        rootFiles: mergedRepo.rootFiles,
        topics: mergedRepo.topics,
      });

      return {
        ...mergedRepo,
        identity,
        techSignals: buildTechSignals({ ...mergedRepo, identity }),
        score: 0,
      };
    });

    const scoredRepos = reposWithSignals
      .map((repo) => ({ ...repo, score: scoreRepo(repo, dataMode) }))
      .sort((left, right) => right.score - left.score);

    const privateShowcaseCandidateNames = new Set<string>(
      dataMode === "private_enriched"
        ? scoredRepos
            .filter(
              (repo) => repo.visibility === "private" && !repo.archived,
            )
            .sort(
              (left, right) =>
                scorePrivateShowcaseRepo(right) - scorePrivateShowcaseRepo(left),
            )
            .slice(0, PRIVATE_SHOWCASE_LIMIT)
            .map((repo) => repo.name.toLowerCase())
        : [],
    );

    const includeShowcaseCandidates =
      dataMode === "private_enriched"
        ? buildRecentShowcaseRepos(scoredRepos, "include")
        : [];
    const hiddenRepresentativeCount =
      dataMode === "private_enriched" && privateExposureMode === "aggregate"
        ? includeShowcaseCandidates.filter(
            (repo) => repo.visibility === "private",
          ).length
        : 0;
    const representativeRepoCandidates =
      dataMode === "private_enriched" && privateExposureMode === "include"
        ? buildRecentShowcaseRepos(scoredRepos, privateExposureMode)
        : buildPublicShowcaseRepos(scoredRepos, pinnedRepos);
    const signalRepoCandidates = buildSignalRepoPool(
      scoredRepos,
      pinnedRepos,
      dataMode,
    );
    const detailTargetNames = new Set<string>([
      ...representativeRepoCandidates
        .slice(0, getRepresentativeDetailLimit())
        .map((repo) => repo.name.toLowerCase()),
      ...signalRepoCandidates.map((repo) => repo.name.toLowerCase()),
      ...privateShowcaseCandidateNames,
    ]);
    const detailedRepos = await Promise.all(
      scoredRepos
        .filter((repo) => detailTargetNames.has(repo.name.toLowerCase()))
        .map(async (repo) => {
          const [rootFiles, recentCommitMessages] = await Promise.all([
            fetchRepoRootFiles(
              username,
              repo,
              forceFresh,
              authAccessToken,
              disableCache,
            ),
            fetchRepoRecentCommitMessages(
              username,
              repo,
              forceFresh,
              authAccessToken,
              disableCache,
            ),
          ]);
          const manifestContents = await fetchRepoManifestContents(
            username,
            repo,
            rootFiles,
            forceFresh,
            authAccessToken,
            disableCache,
          );

          const enrichedRepo: GitHubRepoSnapshot = {
            ...repo,
            manifestContents,
            recentCommitMessages,
            rootFiles,
          };

          const identity = inferRepoIdentity({
            description: enrichedRepo.description,
            githubLanguage: enrichedRepo.language,
            manifestContents: enrichedRepo.manifestContents ?? [],
            name: enrichedRepo.name,
            readme: enrichedRepo.readme,
            recentCommitMessages: enrichedRepo.recentCommitMessages,
            rootFiles: enrichedRepo.rootFiles,
            topics: enrichedRepo.topics,
          });

          return {
            ...enrichedRepo,
            identity,
            techSignals: buildTechSignals({ ...enrichedRepo, identity }),
          };
        }),
    );

    const detailedRepoMap = new Map(
      detailedRepos.map((repo) => [repo.name.toLowerCase(), repo] as const),
    );
    const representativeRepos = representativeRepoCandidates.map(
      (repo) => detailedRepoMap.get(repo.name.toLowerCase()) ?? repo,
    );
    const signalRepos = signalRepoCandidates.map(
      (repo) => detailedRepoMap.get(repo.name.toLowerCase()) ?? repo,
    );
    const scoredReposWithDetails = scoredRepos.map(
      (repo) => detailedRepoMap.get(repo.name.toLowerCase()) ?? repo,
    );

    const lastActiveAt = repos[0]?.updatedAt ?? null;
    const recentRepoCount = repos.filter((repo) => recencyScore(repo.updatedAt) >= 8).length;
    const activityNote = formatActivityNote(locale, lastActiveAt, recentRepoCount);
    const topLanguages = buildTopLanguages(scoredReposWithDetails);
    const stackSummary = summarizeRepoStack(scoredReposWithDetails);
    const authorizedPrivateInsights =
      dataMode === "private_enriched"
        ? buildAuthorizedPrivateInsights(
            scoredReposWithDetails,
            hiddenRepresentativeCount,
            locale,
          )
        : null;

    const source: GitHubSourceData = {
      account: {
        avatarUrl: user.avatar_url,
        bio: user.bio,
        blogUrl: sanitizeExternalUrl(user.blog),
        company: user.company ?? null,
        createdAt: user.created_at,
        email: user.email ?? null,
        followers: user.followers,
        following: user.following,
        location: user.location,
        name: user.name,
        profileUrl: user.html_url,
        publicGistCount: user.public_gists ?? 0,
        publicRepoCount: user.public_repos,
        twitterUsername: user.twitter_username ?? null,
        type: "User",
        updatedAt: user.updated_at,
        username: user.login,
      },
      activity: {
        contributionSummary,
        lastActiveAt,
        note: activityNote,
        recentRepoCount,
      },
      authorizedPrivateInsights,
      cacheKey: [
        dataMode,
        privateExposureMode,
        user.login,
        user.updated_at,
        contributionSummary
          ? `${contributionSummary.endedAt}:${contributionSummary.totalContributions}`
          : "no-contributions",
        lastActiveAt ?? "none",
        representativeRepos.map((repo) => `${repo.name}:${repo.updatedAt}`).join("|"),
        signalRepos.map((repo) => `${repo.name}:${repo.updatedAt}`).join("|"),
      ].join("::"),
      dataMode,
      evidenceSignals: [],
      pinnedRepoNames: pinnedRepos.map((repo) => repo.name),
      privateExposureMode,
      representativeRepos,
      repos: scoredReposWithDetails,
      signalRepos,
      stackSummary,
      topLanguages,
    };

    const finalizedSource = {
      ...source,
      evidenceSignals: buildEvidenceSignals(locale, source),
    };

    if (dataMode === "public") {
      await writeDevCachedSource(username, locale, finalizedSource);
    }

    return finalizedSource;
  } catch (error) {
    if (
      error instanceof GitHubFetchError &&
      error.code === "rate_limited" &&
      isLocalDevelopment() &&
      !authContext
    ) {
      const cachedSource = await readDevCachedSource(username, locale);
      if (cachedSource) {
        return cachedSource;
      }

      return buildDevelopmentFallbackSource(username, locale);
    }

    throw error;
  }
}

const getCachedGitHubSource = unstable_cache(
  async (username: string, locale: Locale) =>
    fetchGitHubSourceInternal(username, locale, false),
  ["githubprint-github-source"],
  { revalidate: CACHE_WINDOW_SECONDS },
);

export async function getGitHubSource(
  username: string,
  options?: {
    authContext?: GitHubSourceAuthContext;
    forceFresh?: boolean;
    locale?: Locale;
    privateExposureMode?: PrivateExposureMode;
  },
) {
  const locale = options?.locale ?? "ko";
  const privateExposureMode = options?.privateExposureMode ?? "aggregate";
  if (options?.authContext) {
    return fetchGitHubSourceInternal(
      username,
      locale,
      true,
      options.authContext,
      privateExposureMode,
    );
  }

  return options?.forceFresh
    ? fetchGitHubSourceInternal(username, locale, true)
    : getCachedGitHubSource(username, locale);
}
