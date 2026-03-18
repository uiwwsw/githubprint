import "server-only";

import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import type {
  LocalizedText,
  ProfileEngineConfig,
  SignalConfig,
} from "@/lib/schemas/rule-config";

export type SignalSource =
  | "language"
  | "topic"
  | "file"
  | "keyword"
  | "commit"
  | "meta";

export type MatchedSignal = {
  id: string;
  source: SignalSource;
  repoName?: string;
  weight: number;
  evidence?: LocalizedText;
  orientationContributions: Record<string, number>;
  workingStyleContributions: Record<string, number>;
};

export type RepoFeature = {
  repo: GitHubRepoSnapshot;
  weight: number;
  matchedSignals: MatchedSignal[];
};

export type ProfileFeatureSet = {
  globalSignals: MatchedSignal[];
  matchedSignalIds: string[];
  repoFeatures: RepoFeature[];
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function matchesSignal(config: SignalConfig, haystacks: string[]) {
  if (!config.matches?.length) {
    return false;
  }

  return haystacks.some((rawHaystack) => {
    const haystack = normalizeText(rawHaystack);
    return config.matches!.some((rawNeedle) => {
      const needle = normalizeText(rawNeedle);
      if (config.matchMode === "includes") {
        return haystack.includes(needle);
      }
      if (config.matchMode === "startsWith") {
        return haystack.startsWith(needle);
      }
      return haystack === needle;
    });
  });
}

function createMatch(
  config: SignalConfig,
  source: SignalSource,
  weight: number,
  repoName?: string,
): MatchedSignal {
  const scale = source === "meta" ? 1 : weight;

  return {
    evidence: config.evidence,
    id: config.id,
    orientationContributions: Object.fromEntries(
      Object.entries(config.contributions.orientations).map(([key, value]) => [
        key,
        value * scale,
      ]),
    ),
    repoName,
    source,
    weight: scale,
    workingStyleContributions: Object.fromEntries(
      Object.entries(config.contributions.workingStyles).map(([key, value]) => [
        key,
        value * scale,
      ]),
    ),
  };
}

function buildRepoWeight(repo: GitHubRepoSnapshot, maxScore: number) {
  const base = maxScore > 0 ? repo.score / maxScore : 0.5;
  const enriched =
    0.45 +
    base * 0.45 +
    (repo.isPinned ? 0.08 : 0) +
    (repo.homepageUrl ? 0.07 : 0) +
    (repo.readme && repo.readme.length > 500 ? 0.05 : 0);

  return Math.min(1.15, Math.max(0.4, enriched));
}

function collectRepoSignals(
  repo: GitHubRepoSnapshot,
  weight: number,
  config: ProfileEngineConfig,
) {
  const matches: MatchedSignal[] = [];
  const languageHaystacks = [repo.language ?? "", ...repo.techSignals];
  const topicHaystacks = repo.topics;
  const fileHaystacks = repo.rootFiles;
  const keywordHaystacks = [`${repo.description ?? ""}\n${repo.readme ?? ""}`];
  const commitHaystacks = repo.recentCommitMessages;

  config.signals.languages.forEach((signal) => {
    if (matchesSignal(signal, languageHaystacks)) {
      matches.push(createMatch(signal, "language", weight, repo.name));
    }
  });

  config.signals.topics.forEach((signal) => {
    if (matchesSignal(signal, topicHaystacks)) {
      matches.push(createMatch(signal, "topic", weight, repo.name));
    }
  });

  config.signals.files.forEach((signal) => {
    if (matchesSignal(signal, fileHaystacks)) {
      matches.push(createMatch(signal, "file", weight, repo.name));
    }
  });

  config.signals.keywords.forEach((signal) => {
    if (matchesSignal(signal, keywordHaystacks)) {
      matches.push(createMatch(signal, "keyword", weight, repo.name));
    }
  });

  config.signals.commits.forEach((signal) => {
    if (matchesSignal(signal, commitHaystacks)) {
      matches.push(createMatch(signal, "commit", weight, repo.name));
    }
  });

  return matches;
}

function collectGlobalSignals(source: GitHubSourceData, config: ProfileEngineConfig) {
  const triggeredIds = new Set<string>();
  const representativeRepos =
    source.representativeRepos.length > 0
      ? source.representativeRepos
      : source.repos.slice(0, 5);

  const demoCount = representativeRepos.filter((repo) => Boolean(repo.homepageUrl)).length;
  const pinnedCount = representativeRepos.filter((repo) => repo.isPinned).length;
  const richReadmeCount = representativeRepos.filter(
    (repo) => (repo.readme?.length ?? 0) >= 700,
  ).length;
  const recentRepresentativeCount = representativeRepos.filter((repo) => {
    const age = Date.now() - new Date(repo.updatedAt).getTime();
    return age <= 1000 * 60 * 60 * 24 * 90;
  }).length;

  if (demoCount >= 1) triggeredIds.add("meta:has-demo");
  if (demoCount >= 2) triggeredIds.add("meta:multiple-demos");
  if (richReadmeCount >= 1) triggeredIds.add("meta:rich-readme");
  if (recentRepresentativeCount >= 1) triggeredIds.add("meta:recent-update");
  if (pinnedCount >= 1) triggeredIds.add("meta:pinned");
  if (pinnedCount >= 2 || source.pinnedRepoNames.length >= 2) {
    triggeredIds.add("meta:multiple-pinned");
  }
  if (source.activity.recentRepoCount >= 5) {
    triggeredIds.add("meta:high-activity");
  } else if (source.activity.recentRepoCount >= 2) {
    triggeredIds.add("meta:steady-activity");
  }
  if (source.account.publicRepoCount >= 12 || representativeRepos.length >= 4) {
    triggeredIds.add("meta:portfolio-depth");
  }

  return config.signals.meta
    .filter((signal) => triggeredIds.has(signal.id))
    .map((signal) => createMatch(signal, "meta", 1));
}

export function extractProfileFeatures(
  source: GitHubSourceData,
  config: ProfileEngineConfig,
): ProfileFeatureSet {
  const representativeRepos =
    source.representativeRepos.length > 0
      ? source.representativeRepos
      : source.repos.slice(0, 5);
  const maxScore = Math.max(...representativeRepos.map((repo) => repo.score), 1);
  const repoFeatures = representativeRepos.map((repo) => {
    const weight = buildRepoWeight(repo, maxScore);
    return {
      matchedSignals: collectRepoSignals(repo, weight, config),
      repo,
      weight,
    };
  });
  const globalSignals = collectGlobalSignals(source, config);
  const matchedSignalIds = new Set<string>();

  [...globalSignals, ...repoFeatures.flatMap((item) => item.matchedSignals)].forEach(
    (signal) => matchedSignalIds.add(signal.id),
  );

  return {
    globalSignals,
    matchedSignalIds: [...matchedSignalIds],
    repoFeatures,
  };
}
