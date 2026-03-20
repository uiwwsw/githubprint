import "server-only";

import {
  repoIdentityPresentationRules,
  repoIdentityRules,
} from "@/lib/data-loader";
import type {
  RepoIdentityPresentationRule,
  RepoIdentitySignalSource,
} from "@/lib/schemas/repo-identity";

export type RepoIdentityInput = {
  description: string | null;
  githubLanguage: string | null;
  manifestContents: string[];
  name: string;
  readme: string | null;
  recentCommitMessages: string[];
  rootFiles: string[];
  topics: string[];
};

export type RepoIdentityRankedLabel = {
  label: string;
  score: number;
};

export type RepoIdentityEvidence = {
  description: string;
  matchedValue: string;
  pattern: string;
  ruleId: string;
  source: RepoIdentitySignalSource;
  weight: number;
};

export type RepoIdentity = {
  ambiguityReasons: string[];
  confidence: number;
  domains: RepoIdentityRankedLabel[];
  evidence: RepoIdentityEvidence[];
  flags: string[];
  frameworks: RepoIdentityRankedLabel[];
  languages: RepoIdentityRankedLabel[];
  primaryLanguage: string | null;
  surfaces: RepoIdentityRankedLabel[];
};

export type RepoStackSummary = {
  averageConfidence: number;
  coreStack: string[];
  topLanguages: string[];
  topSurfaces: string[];
};

export type RepoIdentityCapable = {
  description: string | null;
  githubLanguage?: string | null;
  identity?: RepoIdentity;
  language?: string | null;
  manifestContents?: string[];
  name: string;
  readme: string | null;
  recentCommitMessages: string[];
  rootFiles: string[];
  topics: string[];
};

type SummaryRepoLike = RepoIdentityCapable & {
  archived: boolean;
  isPinned: boolean;
  score: number;
  stars: number;
};

function toIdentityInput(input: RepoIdentityCapable): RepoIdentityInput {
  return {
    description: input.description,
    githubLanguage: input.githubLanguage ?? input.language ?? null,
    manifestContents: input.manifestContents ?? [],
    name: input.name,
    readme: input.readme,
    recentCommitMessages: input.recentCommitMessages,
    rootFiles: input.rootFiles,
    topics: input.topics,
  };
}

type MatchEvidence = {
  matchedValue: string;
  pattern: string;
  source: RepoIdentitySignalSource;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesWithTokenBoundary(haystack: string, needle: string) {
  if (needle.includes(" ")) {
    return haystack.includes(needle);
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(needle)}(?=$|[^a-z0-9])`,
    "i",
  );

  return pattern.test(haystack);
}

function matchesValue(
  haystack: string,
  needle: string,
  matchMode: "exact" | "includes" | "startsWith",
) {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);

  if (matchMode === "includes") {
    return includesWithTokenBoundary(normalizedHaystack, normalizedNeedle);
  }

  if (matchMode === "startsWith") {
    return normalizedHaystack.startsWith(normalizedNeedle);
  }

  return normalizedHaystack === normalizedNeedle;
}

function buildSourceMap(input: RepoIdentityInput) {
  return {
    description: input.description ? [input.description] : [],
    githubLanguage: input.githubLanguage ? [input.githubLanguage] : [],
    manifestContents: input.manifestContents,
    readme: input.readme ? [input.readme] : [],
    recentCommitMessages: input.recentCommitMessages,
    repoName: [input.name],
    rootFiles: input.rootFiles,
    topics: input.topics,
  } satisfies Record<RepoIdentitySignalSource, string[]>;
}

function evaluateMatcher(
  input: RepoIdentityInput,
  matcher: {
    matchMode: "exact" | "includes" | "startsWith";
    patterns: string[];
    source: RepoIdentitySignalSource;
  },
) {
  const haystacks = buildSourceMap(input)[matcher.source] ?? [];
  const matches: MatchEvidence[] = [];

  haystacks.forEach((haystack) => {
    matcher.patterns.forEach((pattern) => {
      if (matchesValue(haystack, pattern, matcher.matchMode)) {
        matches.push({
          matchedValue: haystack,
          pattern,
          source: matcher.source,
        });
      }
    });
  });

  return matches;
}

function pushWeightedLabels(
  target: Map<string, number>,
  entries: Array<{ label: string; weight: number }>,
) {
  entries.forEach((entry) => {
    target.set(entry.label, (target.get(entry.label) ?? 0) + entry.weight);
  });
}

function sortRankedLabels(target: Map<string, number>) {
  return [...target.entries()]
    .map(([label, score]) => ({
      label,
      score: Number(score.toFixed(2)),
    }))
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function categoryDominance(labels: RepoIdentityRankedLabel[]) {
  if (labels.length === 0) {
    return 0;
  }

  if (labels.length === 1) {
    return 1;
  }

  const topThreeTotal = labels.slice(0, 3).reduce((sum, item) => sum + item.score, 0);
  return topThreeTotal > 0 ? labels[0].score / topThreeTotal : 0;
}

function deriveAmbiguityReasons(
  languages: RepoIdentityRankedLabel[],
  frameworks: RepoIdentityRankedLabel[],
  surfaces: RepoIdentityRankedLabel[],
) {
  const reasons: string[] = [];

  const closeRace = (
    category: string,
    labels: RepoIdentityRankedLabel[],
    threshold: number,
  ) => {
    if (labels.length < 2) {
      return;
    }

    if (Math.abs(labels[0].score - labels[1].score) <= threshold) {
      reasons.push(
        `${category} signals are split between ${labels[0].label} and ${labels[1].label}.`,
      );
    }
  };

  closeRace("Language", languages, 1.2);
  closeRace("Framework", frameworks, 1.1);
  closeRace("Surface", surfaces, 1.4);

  return reasons;
}

function computeConfidence(
  languages: RepoIdentityRankedLabel[],
  frameworks: RepoIdentityRankedLabel[],
  surfaces: RepoIdentityRankedLabel[],
  evidence: RepoIdentityEvidence[],
  confidenceDelta: number,
) {
  if (evidence.length === 0) {
    return 0.08;
  }

  const evidenceWeight = evidence.reduce((sum, item) => sum + item.weight, 0);
  const evidenceStrength = Math.min(1, evidenceWeight / 14);
  const categories = [languages, frameworks, surfaces].filter((items) => items.length > 0);
  const coverage = categories.length / 3;
  const dominance =
    categories.reduce((sum, items) => sum + categoryDominance(items), 0) /
    Math.max(categories.length, 1);
  const githubLanguageOnly = evidence.every((item) => item.source === "githubLanguage");

  const value = Math.max(
    0.05,
    Math.min(
      0.98,
      0.18 +
        evidenceStrength * 0.42 +
        dominance * 0.22 +
        coverage * 0.14 +
        confidenceDelta,
    ),
  );

  if (githubLanguageOnly) {
    return Number(Math.min(value, 0.55).toFixed(2));
  }

  return Number(value.toFixed(2));
}

export function inferRepoIdentity(input: RepoIdentityInput): RepoIdentity {
  const languageScores = new Map<string, number>();
  const frameworkScores = new Map<string, number>();
  const surfaceScores = new Map<string, number>();
  const domainScores = new Map<string, number>();
  const flags = new Set<string>();
  const evidence: RepoIdentityEvidence[] = [];
  let confidenceDelta = 0;

  repoIdentityRules.forEach((rule) => {
    const allMatches = rule.when.all.map((matcher) => evaluateMatcher(input, matcher));
    const anyMatches = rule.when.any.map((matcher) => evaluateMatcher(input, matcher));
    const noneMatches = rule.when.none.map((matcher) => evaluateMatcher(input, matcher));
    const allSatisfied = allMatches.every((items) => items.length > 0);
    const anySatisfied = rule.when.any.length === 0 || anyMatches.some((items) => items.length > 0);
    const noneSatisfied = noneMatches.every((items) => items.length === 0);

    if (!allSatisfied || !anySatisfied || !noneSatisfied) {
      return;
    }

    pushWeightedLabels(languageScores, rule.emit.languages);
    pushWeightedLabels(frameworkScores, rule.emit.frameworks);
    pushWeightedLabels(surfaceScores, rule.emit.surfaces);
    pushWeightedLabels(domainScores, rule.emit.domains);
    rule.emit.flags.forEach((flag) => flags.add(flag));
    confidenceDelta += rule.emit.confidenceDelta;

    [...allMatches.flat(), ...anyMatches.flat()]
      .slice(0, 6)
      .forEach((match) => {
        evidence.push({
          description: rule.description,
          matchedValue: match.matchedValue,
          pattern: match.pattern,
          ruleId: rule.id,
          source: match.source,
          weight:
            Math.max(
              ...[
                ...rule.emit.languages,
                ...rule.emit.frameworks,
                ...rule.emit.surfaces,
                ...rule.emit.domains,
              ].map((entry) => entry.weight),
              1,
            ) + Math.max(rule.emit.confidenceDelta, 0),
        });
      });
  });

  const languages = sortRankedLabels(languageScores);
  const frameworks = sortRankedLabels(frameworkScores);
  const surfaces = sortRankedLabels(surfaceScores);
  const domains = sortRankedLabels(domainScores);
  const ambiguityReasons = deriveAmbiguityReasons(languages, frameworks, surfaces);
  const confidence = computeConfidence(
    languages,
    frameworks,
    surfaces,
    evidence,
    confidenceDelta,
  );

  if (
    evidence.length > 0 &&
    evidence.every((item) => item.source === "githubLanguage")
  ) {
    ambiguityReasons.push("Inference relies mostly on GitHub language metadata.");
  }

  if (flags.has("template")) {
    ambiguityReasons.push("Template or starter wording lowers confidence in repo-specific conclusions.");
  }

  return {
    ambiguityReasons: [...new Set(ambiguityReasons)],
    confidence,
    domains,
    evidence: evidence.slice(0, 10),
    flags: [...flags],
    frameworks,
    languages,
    primaryLanguage: languages[0]?.label ?? null,
    surfaces,
  };
}

function repoWeight(repo: SummaryRepoLike) {
  return (
    1 +
    (repo.isPinned ? 0.25 : 0) +
    Math.min(repo.stars, 20) * 0.03 +
    Math.min(repo.score, 100) * 0.005
  );
}

function accumulateRankedLabels(
  target: Map<string, number>,
  labels: RepoIdentityRankedLabel[],
  weight: number,
  limit: number,
) {
  labels.slice(0, limit).forEach((entry) => {
    target.set(entry.label, (target.get(entry.label) ?? 0) + entry.score * weight);
  });
}

function canonicalizeDisplayLabel(label: string) {
  const trimmed = label.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized === "flutter") {
    return "Flutter";
  }

  if (normalized === "ios") {
    return "iOS";
  }

  if (normalized === "objective-c") {
    return "Objective-C";
  }

  if (normalized === "objective-c++") {
    return "Objective-C++";
  }

  return trimmed;
}

function normalizeDisplayLookupValue(label: string) {
  return normalizeText(canonicalizeDisplayLabel(label));
}

type RepoPresentationContext = {
  domains: Set<string>;
  frameworks: Set<string>;
  githubLanguages: Set<string>;
  languages: Set<string>;
  rootFiles: Set<string>;
  surfaces: Set<string>;
  topics: Set<string>;
};

type RepoPresentationTransform = {
  aliasLabels: Map<string, string>;
  preferLabels: string[];
};

function buildPresentationContext(
  repo: RepoIdentityCapable,
  identity: RepoIdentity,
): RepoPresentationContext {
  const githubLanguage = repo.githubLanguage ?? repo.language;

  return {
    domains: new Set(identity.domains.map((item) => normalizeDisplayLookupValue(item.label))),
    frameworks: new Set(
      identity.frameworks.map((item) => normalizeDisplayLookupValue(item.label)),
    ),
    githubLanguages: new Set(
      githubLanguage ? [normalizeDisplayLookupValue(githubLanguage)] : [],
    ),
    languages: new Set(
      identity.languages.map((item) => normalizeDisplayLookupValue(item.label)),
    ),
    rootFiles: new Set(repo.rootFiles.map((file) => normalizeText(file))),
    surfaces: new Set(
      identity.surfaces.map((item) => normalizeDisplayLookupValue(item.label)),
    ),
    topics: new Set(repo.topics.map((topic) => normalizeDisplayLookupValue(topic))),
  };
}

function setMatchesCondition(
  values: Set<string>,
  all: string[],
  any: string[],
  normalizeConditionValue: (value: string) => string,
) {
  const allSatisfied = all.every((value) => values.has(normalizeConditionValue(value)));
  const anySatisfied =
    any.length === 0 || any.some((value) => values.has(normalizeConditionValue(value)));

  return allSatisfied && anySatisfied;
}

function matchesPresentationRule(
  context: RepoPresentationContext,
  rule: RepoIdentityPresentationRule,
) {
  return (
    setMatchesCondition(
      context.frameworks,
      rule.when.frameworksAll,
      rule.when.frameworksAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.languages,
      rule.when.languagesAll,
      rule.when.languagesAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.domains,
      rule.when.domainsAll,
      rule.when.domainsAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.surfaces,
      rule.when.surfacesAll,
      rule.when.surfacesAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.topics,
      rule.when.topicsAll,
      rule.when.topicsAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.githubLanguages,
      rule.when.githubLanguagesAll,
      rule.when.githubLanguagesAny,
      normalizeDisplayLookupValue,
    ) &&
    setMatchesCondition(
      context.rootFiles,
      rule.when.rootFilesAll,
      rule.when.rootFilesAny,
      normalizeText,
    )
  );
}

function buildRepoPresentationTransform(
  repo: RepoIdentityCapable,
  identity: RepoIdentity,
): RepoPresentationTransform {
  const context = buildPresentationContext(repo, identity);
  const aliasLabels = new Map<string, string>();
  const preferLabels: string[] = [];

  [...repoIdentityPresentationRules]
    .sort((left, right) => right.priority - left.priority)
    .filter((rule) => matchesPresentationRule(context, rule))
    .forEach((rule) => {
      rule.transform.aliasLabels.forEach((entry) => {
        const target = canonicalizeDisplayLabel(entry.to);
        entry.from.forEach((source) => {
          const key = normalizeDisplayLookupValue(source);
          if (!aliasLabels.has(key)) {
            aliasLabels.set(key, target);
          }
        });
      });

      rule.transform.preferLabels.forEach((label) => {
        const canonical = canonicalizeDisplayLabel(label);
        if (!preferLabels.includes(canonical)) {
          preferLabels.push(canonical);
        }
      });
    });

  return {
    aliasLabels,
    preferLabels,
  };
}

function applyDisplayAliases(label: string, transform: RepoPresentationTransform) {
  let current = canonicalizeDisplayLabel(label);
  const seen = new Set<string>();

  while (true) {
    const key = normalizeDisplayLookupValue(current);
    const next = transform.aliasLabels.get(key);
    if (!next || seen.has(key)) {
      return current;
    }

    seen.add(key);
    current = canonicalizeDisplayLabel(next);
  }
}

function applyPreferredLabelOrder<T>(
  items: T[],
  getLabel: (item: T) => string,
  preferLabels: string[],
) {
  if (preferLabels.length === 0) {
    return items;
  }

  const preferOrder = new Map(
    preferLabels.map((label, index) => [normalizeDisplayLookupValue(label), index] as const),
  );

  return [...items].sort((left, right) => {
    const leftRank =
      preferOrder.get(normalizeDisplayLookupValue(getLabel(left))) ??
      Number.MAX_SAFE_INTEGER;
    const rightRank =
      preferOrder.get(normalizeDisplayLookupValue(getLabel(right))) ??
      Number.MAX_SAFE_INTEGER;

    return leftRank - rightRank;
  });
}

function collapseDisplayLabels(
  labels: string[],
  preferLabels: string[] = [],
) {
  const deduped = new Map<string, string>();

  labels.forEach((label) => {
    const canonical = canonicalizeDisplayLabel(label);
    const key = normalizeDisplayLookupValue(canonical);

    if (!deduped.has(key)) {
      deduped.set(key, canonical);
    }
  });

  return applyPreferredLabelOrder(
    [...deduped.values()],
    (label) => label,
    preferLabels,
  );
}

function collapseRankedLabelsForDisplay(
  labels: RepoIdentityRankedLabel[],
  transform: RepoPresentationTransform,
) {
  const scores = new Map<string, number>();

  labels.forEach((entry) => {
    const label = applyDisplayAliases(entry.label, transform);
    scores.set(label, (scores.get(label) ?? 0) + entry.score);
  });

  return applyPreferredLabelOrder(
    sortRankedLabels(scores),
    (entry) => entry.label,
    transform.preferLabels,
  );
}

export function normalizeRepoDisplayLabel(
  repo: RepoIdentityCapable,
  label: string,
  identityOverride?: RepoIdentity,
) {
  const identity = identityOverride ?? repo.identity ?? inferRepoIdentity(toIdentityInput(repo));

  return applyDisplayAliases(
    label,
    buildRepoPresentationTransform(repo, identity),
  );
}

export function buildRepoDisplayLanguages(
  repo: RepoIdentityCapable,
) {
  const identity = repo.identity ?? inferRepoIdentity(toIdentityInput(repo));
  const rankedLanguages =
    identity.languages.length > 0
      ? identity.languages
      : repo.githubLanguage ?? repo.language
      ? [{ label: repo.githubLanguage ?? repo.language!, score: 1 }]
        : [];

  return collapseRankedLabelsForDisplay(
    rankedLanguages,
    buildRepoPresentationTransform(repo, identity),
  );
}

export function summarizeRepoStack(repos: SummaryRepoLike[]): RepoStackSummary {
  const activeRepos = repos.filter((repo) => !repo.archived);
  const languageScores = new Map<string, number>();
  const frameworkScores = new Map<string, number>();
  const surfaceScores = new Map<string, number>();
  const domainScores = new Map<string, number>();
  let confidenceTotal = 0;

  activeRepos.forEach((repo) => {
    const identity = repo.identity ?? inferRepoIdentity(toIdentityInput(repo));
    const weight = repoWeight(repo);
    const displayLanguages = buildRepoDisplayLanguages({ ...repo, identity });

    accumulateRankedLabels(languageScores, displayLanguages, weight, 2);
    accumulateRankedLabels(frameworkScores, identity.frameworks, weight, 3);
    accumulateRankedLabels(surfaceScores, identity.surfaces, weight, 2);
    accumulateRankedLabels(domainScores, identity.domains, weight, 2);
    confidenceTotal += identity.confidence;
  });

  const topLanguages = sortRankedLabels(languageScores)
    .map((item) => item.label)
    .slice(0, 6);
  const topFrameworks = sortRankedLabels(frameworkScores)
    .map((item) => item.label)
    .slice(0, 4);
  const topDomains = sortRankedLabels(domainScores)
    .map((item) => item.label)
    .slice(0, 2);
  const coreStack = [...new Set([...topFrameworks, ...topLanguages, ...topDomains])].slice(0, 6);
  const topSurfaces = sortRankedLabels(surfaceScores)
    .map((item) => item.label)
    .slice(0, 4);

  return {
    averageConfidence:
      activeRepos.length > 0
        ? Number((confidenceTotal / activeRepos.length).toFixed(2))
        : 0,
    coreStack,
    topLanguages,
    topSurfaces,
  };
}

export function buildRepoTechStack(
  repo: RepoIdentityCapable,
) {
  const identity = repo.identity ?? inferRepoIdentity(toIdentityInput(repo));
  const presentationTransform = buildRepoPresentationTransform(repo, identity);

  return collapseDisplayLabels([
    ...identity.frameworks.map((item) =>
      applyDisplayAliases(item.label, presentationTransform),
    ),
    ...identity.languages.map((item) =>
      applyDisplayAliases(item.label, presentationTransform),
    ),
    ...identity.domains.map((item) =>
      applyDisplayAliases(item.label, presentationTransform),
    ),
    ...repo.topics.map((item) =>
      applyDisplayAliases(item, presentationTransform),
    ),
    ...(repo.githubLanguage ?? repo.language
      ? [
          applyDisplayAliases(
            repo.githubLanguage ?? repo.language!,
            presentationTransform,
          ),
        ]
      : []),
  ], presentationTransform.preferLabels).slice(0, 8);
}
