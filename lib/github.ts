import "server-only";

import { unstable_cache } from "next/cache";
import { mockGitHubProfile } from "@/fixtures/mock-profile";
import type { Locale } from "@/lib/schemas";

type GitHubUserResponse = {
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  created_at: string;
  followers: number;
  following: number;
  html_url: string;
  location: string | null;
  login: string;
  name: string | null;
  public_repos: number;
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

export type GitHubRepoSnapshot = {
  archived: boolean;
  defaultBranch: string;
  description: string | null;
  forks: number;
  homepageUrl: string;
  isFork: boolean;
  isPinned: boolean;
  language: string | null;
  name: string;
  openIssuesCount: number;
  pushedAt: string;
  readme: string | null;
  repoUrl: string;
  score: number;
  size: number;
  stars: number;
  techSignals: string[];
  topics: string[];
  updatedAt: string;
};

export type GitHubSourceData = {
  account: {
    avatarUrl: string;
    bio: string | null;
    blogUrl: string | null;
    createdAt: string;
    followers: number;
    following: number;
    location: string | null;
    name: string | null;
    profileUrl: string;
    publicRepoCount: number;
    type: "User";
    updatedAt: string;
    username: string;
  };
  activity: {
    lastActiveAt: string | null;
    note: string;
    recentRepoCount: number;
  };
  cacheKey: string;
  evidenceSignals: string[];
  pinnedRepoNames: string[];
  representativeRepos: GitHubRepoSnapshot[];
  repos: GitHubRepoSnapshot[];
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

const GITHUB_API_BASE = "https://api.github.com";
const CACHE_WINDOW_SECONDS = 60 * 15;
const README_CANDIDATE_LIMIT = 8;
const GRAPHQL_PINNED_QUERY = `
  query GitFolioPinnedRepos($login: String!) {
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

function buildGitHubHeaders(
  accept: string,
  initHeaders?: HeadersInit,
) {
  const token = process.env.GITHUB_TOKEN?.trim();
  const headers = new Headers(initHeaders);

  headers.set("Accept", accept);
  headers.set("User-Agent", "GitFolio-MVP");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function githubRequest(
  path: string,
  options?: {
    accept?: string;
    forceFresh?: boolean;
    init?: RequestInit;
  },
) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options?.init,
    cache: options?.forceFresh ? "no-store" : "force-cache",
    next: options?.forceFresh ? undefined : { revalidate: CACHE_WINDOW_SECONDS },
    headers: buildGitHubHeaders(
      options?.accept ?? "application/vnd.github+json",
      options?.init?.headers,
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
    forceFresh?: boolean;
    init?: RequestInit;
  },
) {
  const response = await githubRequest(path, options);
  return (await response.json()) as T;
}

async function fetchPinnedRepos(
  username: string,
  forceFresh?: boolean,
) {
  if (!process.env.GITHUB_TOKEN) {
    return [];
  }

  const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
    method: "POST",
    cache: forceFresh ? "no-store" : "force-cache",
    next: forceFresh ? undefined : { revalidate: CACHE_WINDOW_SECONDS },
    headers: buildGitHubHeaders("application/json", {
      "Content-Type": "application/json",
    }),
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
    homepageUrl: repo.homepageUrl ?? "",
    stars: repo.stargazerCount,
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    updatedAt: repo.updatedAt,
    url: repo.url,
  }));
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

async function fetchRepoReadme(
  username: string,
  repo: Pick<GitHubRepoSnapshot, "name">,
  forceFresh?: boolean,
) {
  try {
    const json = await githubJson<GitHubReadmeResponse>(
      `/repos/${username}/${repo.name}/readme`,
      {
        forceFresh,
      },
    );

    return sanitizeReadme(decodeReadme(json));
  } catch {
    return null;
  }
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
  language: string | null;
  topics: string[];
  readme: string | null;
}) {
  const signals = new Set<string>();

  if (repo.language) {
    signals.add(repo.language);
  }

  repo.topics.slice(0, 5).forEach((topic) => signals.add(topic));

  if (repo.readme) {
    const lowercaseReadme = repo.readme.toLowerCase();
    ["next.js", "react", "typescript", "tailwind", "node", "docker"].forEach(
      (keyword) => {
        if (lowercaseReadme.includes(keyword)) {
          signals.add(keyword);
        }
      },
    );
  }

  return [...signals].slice(0, 6);
}

function scoreRepo(repo: GitHubRepoSnapshot) {
  return (
    Math.min(repo.stars * 3, 30) +
    recencyScore(repo.updatedAt) +
    readmeScore(repo.readme) +
    (repo.isPinned ? 18 : 0) +
    (repo.description ? 8 : 0) +
    (repo.homepageUrl ? 4 : 0) +
    Math.min(repo.topics.length * 1.2, 6) +
    (repo.language ? 3 : 0) +
    (repo.isFork ? -12 : 0) +
    (repo.archived ? -20 : 0)
  );
}

function formatActivityNote(
  locale: Locale,
  lastActiveAt: string | null,
  recentRepoCount: number,
) {
  if (!lastActiveAt) {
    return locale === "ko"
      ? "공개 저장소 활동 신호가 많지 않아 최근 작업 패턴을 읽기 어렵습니다."
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

function getRepoPoolForReadmes(repos: GitHubRepoSnapshot[]) {
  const pool = new Map<string, GitHubRepoSnapshot>();

  repos
    .filter((repo) => !repo.archived)
    .sort((left, right) => right.stars - left.stars)
    .slice(0, README_CANDIDATE_LIMIT)
    .forEach((repo) => pool.set(repo.name, repo));

  repos
    .filter((repo) => !repo.archived)
    .slice(0, README_CANDIDATE_LIMIT)
    .forEach((repo) => pool.set(repo.name, repo));

  repos
    .filter((repo) => repo.isPinned)
    .forEach((repo) => pool.set(repo.name, repo));

  return [...pool.values()].slice(0, README_CANDIDATE_LIMIT);
}

function buildTopLanguages(repos: GitHubRepoSnapshot[]) {
  const languageMap = new Map<string, { repoCount: number; score: number }>();

  repos
    .filter((repo) => repo.language && !repo.archived)
    .forEach((repo) => {
      const language = repo.language as string;
      const existing = languageMap.get(language) ?? { repoCount: 0, score: 0 };
      existing.repoCount += 1;
      existing.score += 4 + Math.min(repo.stars, 20) * 0.6 + (repo.isPinned ? 2 : 0);
      languageMap.set(language, existing);
    });

  return [...languageMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function buildEvidenceSignals(
  locale: Locale,
  source: Pick<GitHubSourceData, "activity" | "representativeRepos" | "topLanguages" | "account">,
) {
  const signals: string[] = [];

  if (source.topLanguages.length > 0) {
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
        ? "대표 프로젝트 중 실행 가능한 demo 혹은 외부 링크가 연결된 사례가 있습니다."
        : "Some standout projects include a runnable demo or an external product link.",
    );
  }

  signals.push(source.activity.note);
  signals.push(
    locale === "ko"
      ? `공개 저장소 수는 ${source.account.publicRepoCount}개, 팔로워 수는 ${source.account.followers}명입니다.`
      : `The account has ${source.account.publicRepoCount} public repositories and ${source.account.followers} followers.`,
  );

  return signals.slice(0, 5);
}

async function fetchGitHubSourceInternal(
  username: string,
  locale: Locale,
  forceFresh?: boolean,
): Promise<GitHubSourceData> {
  const useFixture =
    process.env.NODE_ENV !== "production" &&
    process.env.GITFOLIO_USE_FIXTURE === "1";

  if (useFixture) {
    return {
      ...mockGitHubProfile,
      activity: {
        ...mockGitHubProfile.activity,
        note: formatActivityNote(
          locale,
          mockGitHubProfile.activity.lastActiveAt,
          mockGitHubProfile.activity.recentRepoCount,
        ),
      },
      evidenceSignals: buildEvidenceSignals(locale, {
        activity: {
          ...mockGitHubProfile.activity,
          note: formatActivityNote(
            locale,
            mockGitHubProfile.activity.lastActiveAt,
            mockGitHubProfile.activity.recentRepoCount,
          ),
        },
        representativeRepos: mockGitHubProfile.representativeRepos,
        topLanguages: mockGitHubProfile.topLanguages,
        account: mockGitHubProfile.account,
      }),
    };
  }

  const user = await githubJson<GitHubUserResponse>(`/users/${username}`, {
    forceFresh,
  });

  if (user.type === "Organization") {
    throw new GitHubFetchError(
      "organization",
      "조직 계정은 아직 개인 개발자 문서 형식으로 분석하지 않습니다.",
    );
  }

  const reposResponse = await githubJson<GitHubRepoResponse[]>(
    `/users/${username}/repos?per_page=100&sort=updated&direction=desc&type=owner`,
    { forceFresh },
  );

  const pinnedRepos = await fetchPinnedRepos(username, forceFresh);
  const pinnedNames = new Set(pinnedRepos.map((repo) => repo.name.toLowerCase()));

  const repos: GitHubRepoSnapshot[] = reposResponse.map((repo) => ({
    archived: repo.archived,
    defaultBranch: repo.default_branch,
    description: repo.description,
    forks: repo.forks_count,
    homepageUrl: repo.homepage ?? "",
    isFork: repo.fork,
    isPinned: pinnedNames.has(repo.name.toLowerCase()),
    language: repo.language,
    name: repo.name,
    openIssuesCount: repo.open_issues_count,
    pushedAt: repo.pushed_at,
    readme: null,
    repoUrl: repo.html_url,
    score: 0,
    size: repo.size,
    stars: repo.stargazers_count,
    techSignals: [],
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
  }));

  const readmeTargetRepos = getRepoPoolForReadmes(repos);
  const readmes = await Promise.all(
    readmeTargetRepos.map(async (repo) => [
      repo.name,
      await fetchRepoReadme(username, repo, forceFresh),
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
      homepageUrl: repo.homepageUrl || pinnedFromGraph?.homepageUrl || "",
      readme: readmeMap.get(repo.name) ?? null,
      topics:
        repo.topics.length > 0
          ? repo.topics
          : (pinnedFromGraph?.topics ?? []).slice(0, 8),
    };

    return {
      ...mergedRepo,
      techSignals: buildTechSignals(mergedRepo),
      score: 0,
    };
  });

  const scoredRepos = reposWithSignals
    .map((repo) => ({ ...repo, score: scoreRepo(repo) }))
    .sort((left, right) => right.score - left.score);

  const representativeRepos = scoredRepos
    .filter((repo) => !repo.archived)
    .slice(0, 5);

  const lastActiveAt = repos[0]?.updatedAt ?? null;
  const recentRepoCount = repos.filter((repo) => recencyScore(repo.updatedAt) >= 8).length;
  const activityNote = formatActivityNote(locale, lastActiveAt, recentRepoCount);
  const topLanguages = buildTopLanguages(scoredRepos);

  const source: GitHubSourceData = {
    account: {
      avatarUrl: user.avatar_url,
      bio: user.bio,
      blogUrl: user.blog,
      createdAt: user.created_at,
      followers: user.followers,
      following: user.following,
      location: user.location,
      name: user.name,
      profileUrl: user.html_url,
      publicRepoCount: user.public_repos,
      type: "User",
      updatedAt: user.updated_at,
      username: user.login,
    },
    activity: {
      lastActiveAt,
      note: activityNote,
      recentRepoCount,
    },
    cacheKey: [
      user.login,
      user.updated_at,
      lastActiveAt ?? "none",
      representativeRepos.map((repo) => `${repo.name}:${repo.updatedAt}`).join("|"),
    ].join("::"),
    evidenceSignals: [],
    pinnedRepoNames: pinnedRepos.map((repo) => repo.name),
    representativeRepos,
    repos: scoredRepos,
    topLanguages,
  };

  return {
    ...source,
    evidenceSignals: buildEvidenceSignals(locale, source),
  };
}

const getCachedGitHubSource = unstable_cache(
  async (username: string, locale: Locale) => fetchGitHubSourceInternal(username, locale, false),
  ["gitfolio-github-source"],
  { revalidate: CACHE_WINDOW_SECONDS },
);

export async function getGitHubSource(
  username: string,
  options?: { forceFresh?: boolean; locale?: Locale },
) {
  const locale = options?.locale ?? "ko";
  return options?.forceFresh
    ? fetchGitHubSourceInternal(username, locale, true)
    : getCachedGitHubSource(username, locale);
}
