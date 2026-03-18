import "server-only";

import { localizeText } from "@/lib/data-loader";
import type { GitHubSourceData } from "@/lib/github";
import type {
  OrientationCategory,
  ProfileEngineConfig,
  RoleRule,
  StrengthRule,
  WorkingStyleCategory,
} from "@/lib/schemas/rule-config";
import type { Locale } from "@/lib/schemas";
import type { MatchedSignal, ProfileFeatureSet, RepoFeature } from "@/lib/profile-features";

type ScoreMap = Record<string, number>;

export type ScoredOrientation = {
  developerType: string;
  headline: string;
  id: string;
  label: string;
  rawScore: number;
  score: number;
};

export type ScoredWorkingStyle = {
  id: string;
  label: string;
  rawScore: number;
  score: number;
  text: string;
};

export type ProfileScoringResult = {
  confidence: number;
  confidenceBand: "high" | "medium" | "low";
  matchedSignalIds: string[];
  orientationEvidence: string[];
  orientationScores: ScoreMap;
  orientations: ScoredOrientation[];
  primaryOrientation: ScoredOrientation | null;
  primaryWorkingStyle: ScoredWorkingStyle | null;
  repoFeatures: RepoFeature[];
  roles: string[];
  secondaryOrientation: ScoredOrientation | null;
  secondaryWorkingStyle: ScoredWorkingStyle | null;
  strengths: string[];
  workingStyleEvidence: string[];
  workingStyleScores: ScoreMap;
  workingStyles: ScoredWorkingStyle[];
};

function incrementScores(target: ScoreMap, contributions: ScoreMap) {
  Object.entries(contributions).forEach(([key, value]) => {
    target[key] = (target[key] ?? 0) + value;
  });
}

function normalizeCategoryScore(rawScore: number, scoreCap: number) {
  return Math.max(0, Math.min(100, Math.round((rawScore / scoreCap) * 100)));
}

function getOrientationBand(category: OrientationCategory, score: number) {
  return [...category.bands]
    .sort((left, right) => right.min - left.min)
    .find((band) => score >= band.min) ?? category.bands[category.bands.length - 1];
}

function getWorkingStyleBand(category: WorkingStyleCategory, score: number) {
  return [...category.bands]
    .sort((left, right) => right.min - left.min)
    .find((band) => score >= band.min) ?? category.bands[category.bands.length - 1];
}

function groupEvidenceByCategory(
  signals: MatchedSignal[],
  locale: Locale,
  categoryId: string,
  key: "orientationContributions" | "workingStyleContributions",
) {
  const evidenceMap = new Map<string, { detail: string; score: number }>();

  signals.forEach((signal) => {
    const contribution = signal[key][categoryId] ?? 0;
    if (contribution <= 0 || !signal.evidence) {
      return;
    }

    const existing = evidenceMap.get(signal.id);
    const detail = localizeText(signal.evidence, locale);
    evidenceMap.set(signal.id, {
      detail,
      score: (existing?.score ?? 0) + contribution,
    });
  });

  return [...evidenceMap.values()]
    .sort((left, right) => right.score - left.score)
    .map((item) => item.detail)
    .slice(0, 3);
}

function ruleMatches(
  rule: StrengthRule | RoleRule,
  orientationScores: ScoreMap,
  workingStyleScores: ScoreMap,
  matchedSignalIds: Set<string>,
) {
  const orientationCheck = Object.entries(rule.minOrientationScores ?? {}).every(
    ([id, minScore]) => (orientationScores[id] ?? 0) >= minScore,
  );
  const workingStyleCheck = Object.entries(rule.minWorkingStyleScores ?? {}).every(
    ([id, minScore]) => (workingStyleScores[id] ?? 0) >= minScore,
  );
  const anySignalsCheck =
    !rule.anySignals?.length ||
    rule.anySignals.some((signalId) => matchedSignalIds.has(signalId));
  const allSignalsCheck =
    !rule.allSignals?.length ||
    rule.allSignals.every((signalId) => matchedSignalIds.has(signalId));

  return orientationCheck && workingStyleCheck && anySignalsCheck && allSignalsCheck;
}

function computeConfidence(
  source: GitHubSourceData,
  featureSet: ProfileFeatureSet,
  primaryOrientation: ScoredOrientation | null,
  secondaryOrientation: ScoredOrientation | null,
) {
  const uniqueSignalFactor = Math.min(1, featureSet.matchedSignalIds.length / 10);
  const repoFactor = Math.min(1, featureSet.repoFeatures.length / 5);
  const activityFactor =
    source.activity.recentRepoCount >= 5
      ? 1
      : source.activity.recentRepoCount >= 2
        ? 0.7
        : source.activity.recentRepoCount >= 1
          ? 0.45
          : 0.25;
  const separationFactor = primaryOrientation
    ? secondaryOrientation
      ? Math.min(
          1,
          Math.max(0.15, (primaryOrientation.score - secondaryOrientation.score) / 35),
        )
      : Math.min(1, Math.max(0.2, primaryOrientation.score / 70))
    : 0.2;

  return Math.round(
    (uniqueSignalFactor * 0.35 +
      repoFactor * 0.25 +
      activityFactor * 0.2 +
      separationFactor * 0.2) *
      100,
  );
}

function confidenceBand(value: number) {
  if (value >= 70) {
    return "high" as const;
  }
  if (value >= 45) {
    return "medium" as const;
  }
  return "low" as const;
}

function localizeRuleMatches<T extends StrengthRule | RoleRule>(
  rules: T[],
  locale: Locale,
  orientationScores: ScoreMap,
  workingStyleScores: ScoreMap,
  matchedSignalIds: Set<string>,
  limit: number,
) {
  return rules
    .filter((rule) =>
      ruleMatches(rule, orientationScores, workingStyleScores, matchedSignalIds),
    )
    .sort((left, right) => right.priority - left.priority)
    .map((rule) => localizeText(rule.text, locale))
    .slice(0, limit);
}

export function scoreProfile(
  source: GitHubSourceData,
  featureSet: ProfileFeatureSet,
  config: ProfileEngineConfig,
  locale: Locale,
): ProfileScoringResult {
  const orientationRawScores: ScoreMap = {};
  const workingStyleRawScores: ScoreMap = {};
  const allSignals = [
    ...featureSet.globalSignals,
    ...featureSet.repoFeatures.flatMap((item) => item.matchedSignals),
  ];

  allSignals.forEach((signal) => {
    incrementScores(orientationRawScores, signal.orientationContributions);
    incrementScores(workingStyleRawScores, signal.workingStyleContributions);
  });

  const orientations = config.rules.orientations
    .map((category) => {
      const score = normalizeCategoryScore(
        orientationRawScores[category.id] ?? 0,
        category.scoreCap,
      );
      const band = getOrientationBand(category, score);

      return {
        developerType: localizeText(band.developerType, locale),
        headline: localizeText(band.headline, locale),
        id: category.id,
        label: localizeText(category.label, locale),
        rawScore: orientationRawScores[category.id] ?? 0,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const workingStyles = config.rules.workingStyles
    .map((category) => {
      const score = normalizeCategoryScore(
        workingStyleRawScores[category.id] ?? 0,
        category.scoreCap,
      );
      const band = getWorkingStyleBand(category, score);

      return {
        id: category.id,
        label: localizeText(category.label, locale),
        rawScore: workingStyleRawScores[category.id] ?? 0,
        score,
        text: localizeText(band.text, locale),
      };
    })
    .sort((left, right) => right.score - left.score);

  const primaryOrientation = orientations[0] ?? null;
  const secondaryOrientation = orientations[1] ?? null;
  const primaryWorkingStyle = workingStyles[0] ?? null;
  const secondaryWorkingStyle = workingStyles[1] ?? null;
  const matchedSignalIds = new Set(featureSet.matchedSignalIds);
  const strengthMatches = localizeRuleMatches(
    config.rules.strengths,
    locale,
    Object.fromEntries(orientations.map((item) => [item.id, item.score])),
    Object.fromEntries(workingStyles.map((item) => [item.id, item.score])),
    matchedSignalIds,
    4,
  );
  const roleMatches = localizeRuleMatches(
    config.rules.roles,
    locale,
    Object.fromEntries(orientations.map((item) => [item.id, item.score])),
    Object.fromEntries(workingStyles.map((item) => [item.id, item.score])),
    matchedSignalIds,
    4,
  );
  const confidence = computeConfidence(
    source,
    featureSet,
    primaryOrientation,
    secondaryOrientation,
  );
  const normalizedOrientationScores = Object.fromEntries(
    orientations.map((item) => [item.id, item.score]),
  );
  const normalizedWorkingStyleScores = Object.fromEntries(
    workingStyles.map((item) => [item.id, item.score]),
  );

  return {
    confidence,
    confidenceBand: confidenceBand(confidence),
    matchedSignalIds: [...matchedSignalIds],
    orientationEvidence: primaryOrientation
      ? groupEvidenceByCategory(
          allSignals,
          locale,
          primaryOrientation.id,
          "orientationContributions",
        )
      : [],
    orientationScores: normalizedOrientationScores,
    orientations,
    primaryOrientation,
    primaryWorkingStyle,
    repoFeatures: featureSet.repoFeatures,
    roles: roleMatches,
    secondaryOrientation,
    secondaryWorkingStyle,
    strengths: strengthMatches,
    workingStyleEvidence: primaryWorkingStyle
      ? groupEvidenceByCategory(
          allSignals,
          locale,
          primaryWorkingStyle.id,
          "workingStyleContributions",
        )
      : [],
    workingStyleScores: normalizedWorkingStyleScores,
    workingStyles,
  };
}
