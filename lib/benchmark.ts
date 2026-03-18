import "server-only";

import { benchmarkCohorts, localizeText } from "@/lib/data-loader";
import type { GitHubSourceData } from "@/lib/github";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import {
  benchmarkSnapshotSchema,
  type BenchmarkSnapshot,
  type Locale,
} from "@/lib/schemas";

type BenchmarkMetricValue = {
  id: string;
  value: number;
};

function daysSince(dateString: string | null) {
  if (!dateString) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function estimatePercentile(
  value: number,
  distribution: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  },
) {
  const anchors = [
    { percentile: 1, value: 0 },
    { percentile: 10, value: distribution.p10 },
    { percentile: 25, value: distribution.p25 },
    { percentile: 50, value: distribution.p50 },
    { percentile: 75, value: distribution.p75 },
    { percentile: 90, value: distribution.p90 },
    { percentile: 99, value: 100 },
  ];

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    if (value <= current.value) {
      const range = Math.max(1, current.value - previous.value);
      const ratio = Math.max(0, Math.min(1, (value - previous.value) / range));
      return Math.round(previous.percentile + ratio * (current.percentile - previous.percentile));
    }
  }

  return 99;
}

function getMetricValues(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
): BenchmarkMetricValue[] {
  const recentDays = daysSince(source.activity.lastActiveAt);
  const recentActivityScore =
    source.activity.recentRepoCount >= 5
      ? 45
      : source.activity.recentRepoCount >= 3
        ? 34
        : source.activity.recentRepoCount >= 1
          ? 18
          : 6;
  const recencyBoost =
    recentDays === null
      ? 4
      : recentDays <= 30
        ? 25
        : recentDays <= 90
          ? 18
          : recentDays <= 180
            ? 10
            : 4;
  const activity = Math.min(
    100,
    recentActivityScore +
      recencyBoost +
      Math.min(30, source.account.publicRepoCount * 1.1),
  );
  const documentation = scoring.workingStyleScores.documentation ?? 0;
  const shipping = scoring.workingStyleScores.shipping ?? 0;
  const quality = scoring.workingStyleScores.quality ?? 0;
  const representativeRepos = source.representativeRepos;
  const portfolioClarity = Math.min(
    100,
    representativeRepos.length * 6 +
      source.pinnedRepoNames.length * 5 +
      representativeRepos.filter((repo) => Boolean(repo.homepageUrl)).length * 12 +
      representativeRepos.filter((repo) => (repo.readme?.length ?? 0) >= 280).length * 8 +
      representativeRepos.filter((repo) => repo.isPinned || repo.stars >= 10).length * 9,
  );
  const primaryScore = scoring.primaryOrientation?.score ?? 0;
  const secondaryScore = scoring.secondaryOrientation?.score ?? 0;
  const specializationClarity = Math.min(
    100,
    primaryScore * 0.75 +
      Math.max(0, primaryScore - secondaryScore) * 0.5 +
      scoring.orientationEvidence.length * 6,
  );

  return [
    { id: "activity", value: activity },
    { id: "documentation", value: documentation },
    { id: "shipping", value: shipping },
    { id: "quality", value: quality },
    { id: "portfolioClarity", value: portfolioClarity },
    { id: "specializationClarity", value: specializationClarity },
  ];
}

function getCohortId(scoring: ProfileScoringResult) {
  const primary = scoring.primaryOrientation;
  if (!primary || primary.score < 45) {
    return "generalist";
  }

  return primary.id;
}

function buildMetricNote(
  percentile: number,
  label: string,
  locale: Locale,
) {
  if (percentile >= 75) {
    return locale === "ko"
      ? `${label}은 공개 GitHub 기준에서 비교적 두드러집니다.`
      : `${label} is relatively strong against public GitHub peers.`;
  }
  if (percentile >= 45) {
    return locale === "ko"
      ? `${label}은 비슷한 개발자군 안에서 중간 이상입니다.`
      : `${label} reads as slightly above the middle of a similar cohort.`;
  }

  return locale === "ko"
    ? `${label}은 아직 단정하기 어려워 더 조심스럽게 보는 편이 맞습니다.`
    : `${label} should still be interpreted more conservatively.`;
}

function buildBenchmarkInsight(
  overallPercentile: number,
  cohortLabel: string,
  metrics: BenchmarkSnapshot["metrics"],
  locale: Locale,
) {
  const strongest = [...metrics]
    .sort((left, right) => right.percentile - left.percentile)
    .slice(0, 2)
    .map((item) => item.label);

  if (overallPercentile >= 75) {
    return locale === "ko"
      ? `${cohortLabel} 안에서 전반적으로 상위권에 가깝고, 특히 ${strongest.join(", ")}이 두드러집니다.`
      : `Within the ${cohortLabel}, the profile lands in the stronger end overall, especially around ${strongest.join(", ")}.`;
  }
  if (overallPercentile >= 45) {
    return locale === "ko"
      ? `${cohortLabel} 안에서 전반적으로 중간 이상이며, ${strongest.join(", ")}이 상대적으로 더 뚜렷합니다.`
      : `Within the ${cohortLabel}, the profile reads above the middle overall, with relatively clearer signals around ${strongest.join(", ")}.`;
  }

  return locale === "ko"
    ? `${cohortLabel}과의 비교는 아직 조심스럽게 봐야 하지만, ${strongest.join(", ")}이 상대적으로 더 두드러집니다.`
    : `Comparison against the ${cohortLabel} should still be read conservatively, but ${strongest.join(", ")} currently show the clearest relative signals.`;
}

export function buildBenchmarkSnapshot(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  locale: Locale,
): BenchmarkSnapshot {
  const cohortId = getCohortId(scoring);
  const cohort =
    benchmarkCohorts.find((item) => item.id === cohortId) ??
    benchmarkCohorts.find((item) => item.id === "generalist")!;
  const metricValues = getMetricValues(source, scoring);
  const metrics = cohort.metrics.map((metric) => {
    const value = metricValues.find((item) => item.id === metric.id)?.value ?? 0;
    const label = localizeText(metric.label, locale);
    const percentile = estimatePercentile(value, metric.distribution);

    return {
      id: metric.id,
      label,
      note: buildMetricNote(percentile, label, locale),
      percentile,
      value: Math.round(value),
    };
  });
  const overallPercentile = Math.round(
    metrics.reduce((sum, item) => sum + item.percentile, 0) / metrics.length,
  );

  return benchmarkSnapshotSchema.parse({
    cohortId: cohort.id,
    cohortLabel: localizeText(cohort.label, locale),
    confidenceScore: scoring.confidence,
    insight: buildBenchmarkInsight(
      overallPercentile,
      localizeText(cohort.label, locale),
      metrics,
      locale,
    ),
    metrics,
    overallPercentile: Math.max(1, Math.min(99, overallPercentile)),
    sampleSize: cohort.sampleSize,
  });
}
