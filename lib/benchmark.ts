import "server-only";

import { shouldUseBandPresentation } from "@/lib/benchmark-presentation";
import { benchmarkCohorts, localizeText } from "@/lib/data-loader";
import type { GitHubSourceData } from "@/lib/github";
import type { ProfileFeatureSet, MatchedSignal } from "@/lib/profile-features";
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

type BenchmarkMetricId =
  | "activity"
  | "documentation"
  | "shipping"
  | "quality"
  | "portfolioClarity"
  | "specializationClarity";

const signalFallbackEvidence: Record<string, { en: string; ko: string }> = {
  "commit:docs": {
    ko: "docs/readme 관련 커밋 메시지가 반복됩니다.",
    en: "Commit messages repeatedly include docs or README updates.",
  },
  "commit:feat": {
    ko: "feature 단위 커밋 메시지가 반복되어 공개 결과물 흐름이 보입니다.",
    en: "Feature-oriented commit messages recur, suggesting visible output cycles.",
  },
  "commit:release": {
    ko: "release/deploy 관련 커밋 메시지가 확인됩니다.",
    en: "Release or deploy-oriented commit messages are visible.",
  },
  "commit:test": {
    ko: "test 관련 커밋 메시지가 확인됩니다.",
    en: "Test-oriented commit messages are visible.",
  },
  "file:docker": {
    ko: "Docker 관련 설정 파일이 대표 저장소에서 확인됩니다.",
    en: "Docker-related config files are present in representative repositories.",
  },
  "file:docs-dir": {
    ko: "docs 디렉터리가 있는 저장소가 확인됩니다.",
    en: "Some representative repositories include a docs directory.",
  },
  "file:github-workflows": {
    ko: "GitHub Actions 워크플로우 구성이 보입니다.",
    en: "GitHub Actions workflow configuration is visible.",
  },
  "file:jest": {
    ko: "Jest, Vitest, Cypress 같은 테스트 설정 파일이 확인됩니다.",
    en: "Test configuration such as Jest, Vitest, or Cypress is present.",
  },
  "file:next-config": {
    ko: "앱 형태 결과물을 정리한 Next.js 설정 파일이 보입니다.",
    en: "Next.js configuration suggests app-shaped public output.",
  },
  "file:playwright": {
    ko: "Playwright 설정 파일이 있어 검증 흐름이 확인됩니다.",
    en: "A Playwright config suggests visible verification setup.",
  },
  "file:storybook": {
    ko: "Storybook 구성이 있어 UI 문서화와 검증 흔적이 보입니다.",
    en: "Storybook setup suggests visible UI documentation and review.",
  },
  "keyword:docs": {
    ko: "README나 설명문에 documentation, guide, usage 같은 표현이 보입니다.",
    en: "README or repository descriptions include terms like documentation, guide, or usage.",
  },
  "keyword:testing": {
    ko: "README나 설명문에 testing, e2e, coverage 같은 표현이 보입니다.",
    en: "README or repository descriptions include terms like testing, e2e, or coverage.",
  },
  "language:mdx": {
    ko: "MDX 사용이 문서화 흐름과 함께 나타납니다.",
    en: "MDX usage appears alongside documentation-oriented work.",
  },
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
  conservative: boolean,
) {
  if (conservative && percentile >= 75) {
    return locale === "ko"
      ? `${label}은 상위권 신호가 보이지만 공개 근거 범위에서는 보수적으로 읽는 편이 맞습니다.`
      : `${label} shows stronger signals, but the public evidence should still be read conservatively.`;
  }
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
  conservative: boolean,
) {
  const strongest = [...metrics]
    .sort((left, right) => right.percentile - left.percentile)
    .slice(0, 2)
    .map((item) => item.label);

  if (conservative && overallPercentile >= 75) {
    return locale === "ko"
      ? `${cohortLabel} 안에서 상위권 신호가 보이지만, 공개 근거 범위에서는 ${strongest.join(", ")}을 중심으로 보수적으로 해석하는 편이 맞습니다.`
      : `Against the ${cohortLabel}, the profile shows stronger-end signals, but it is safer to read them conservatively around ${strongest.join(", ")}.`;
  }
  if (conservative && overallPercentile >= 45) {
    return locale === "ko"
      ? `${cohortLabel} 안에서 중간 이상 신호가 보이지만, ${strongest.join(", ")}을 중심으로 대략적인 구간 해석에 가깝습니다.`
      : `Against the ${cohortLabel}, the profile reads above the middle, but it is closer to an approximate band centered on ${strongest.join(", ")}.`;
  }
  if (conservative) {
    return locale === "ko"
      ? `${cohortLabel}과의 비교는 아직 조심스럽게 봐야 하지만, ${strongest.join(", ")}이 상대적으로 더 선명한 신호입니다.`
      : `Comparison against the ${cohortLabel} should still be cautious, though ${strongest.join(", ")} remain the clearest relative signals.`;
  }

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

function uniqueEvidence(items: Array<string | null | undefined>, limit = 3) {
  return [...new Set(items.filter((item): item is string => Boolean(item)))].slice(0, limit);
}

function formatIsoDate(dateString: string) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toISOString().slice(0, 10);
}

function describeSignalEvidence(signal: MatchedSignal, locale: Locale) {
  const localized = signal.evidence
    ? localizeText(signal.evidence, locale)
    : signalFallbackEvidence[signal.id]?.[locale];

  if (!localized) {
    return null;
  }

  return signal.repoName ? `${signal.repoName}: ${localized}` : localized;
}

function buildWorkingStyleEvidence(
  metricId: "documentation" | "shipping" | "quality",
  featureSet: ProfileFeatureSet,
  locale: Locale,
) {
  const allSignals = [
    ...featureSet.globalSignals,
    ...featureSet.repoFeatures.flatMap((item) => item.matchedSignals),
  ];

  const ranked = [...allSignals]
    .filter((signal) => (signal.workingStyleContributions[metricId] ?? 0) > 0)
    .map((signal) => ({
      description: describeSignalEvidence(signal, locale),
      score: signal.workingStyleContributions[metricId] ?? 0,
    }))
    .filter((item): item is { description: string; score: number } => Boolean(item.description))
    .sort((left, right) => right.score - left.score);

  return uniqueEvidence(ranked.map((item) => item.description));
}

function buildActivityEvidence(source: GitHubSourceData, locale: Locale) {
  return uniqueEvidence([
    source.activity.recentRepoCount > 0
      ? locale === "ko"
        ? `최근 6개월 안에 갱신된 저장소가 ${source.activity.recentRepoCount}개 보입니다.`
        : `${source.activity.recentRepoCount} repositories show updates within the past six months.`
      : null,
    source.activity.lastActiveAt
      ? locale === "ko"
        ? `마지막 공개 업데이트는 ${formatIsoDate(source.activity.lastActiveAt)} 기준입니다.`
        : `The latest public repository update was on ${formatIsoDate(source.activity.lastActiveAt)}.`
      : null,
    locale === "ko"
      ? `공개 저장소 수는 ${source.account.publicRepoCount}개입니다.`
      : `The account currently exposes ${source.account.publicRepoCount} public repositories.`,
  ]);
}

function buildPortfolioClarityEvidence(source: GitHubSourceData, locale: Locale) {
  const representativeCount = source.representativeRepos.length;
  const pinnedCount = source.representativeRepos.filter((repo) => repo.isPinned).length;
  const demoCount = source.representativeRepos.filter((repo) => Boolean(repo.homepageUrl)).length;
  const longReadmeCount = source.representativeRepos.filter(
    (repo) => (repo.readme?.length ?? 0) >= 280,
  ).length;
  const standoutCount = source.representativeRepos.filter(
    (repo) => repo.isPinned || repo.stars >= 10,
  ).length;

  return uniqueEvidence([
    locale === "ko"
      ? `대표 저장소로 읽히는 프로젝트가 ${representativeCount}개 정리되어 있습니다.`
      : `${representativeCount} repositories are strong enough to act as representative work.`,
    pinnedCount > 0
      ? locale === "ko"
        ? `Pinned 처리된 대표 저장소가 ${pinnedCount}개 있습니다.`
        : `${pinnedCount} representative repositories are pinned on the profile.`
      : null,
    demoCount > 0
      ? locale === "ko"
        ? `실행해 볼 수 있는 demo 또는 homepage 링크가 ${demoCount}개 확인됩니다.`
        : `${demoCount} representative repositories expose a demo or homepage link.`
      : null,
    longReadmeCount > 0
      ? locale === "ko"
        ? `README 길이가 비교적 충분한 대표 저장소가 ${longReadmeCount}개 있습니다.`
        : `${longReadmeCount} representative repositories have comparatively substantial READMEs.`
      : null,
    standoutCount > 0
      ? locale === "ko"
        ? `스타 수나 pinned 여부로 대표작 후보가 ${standoutCount}개 정도 선명합니다.`
        : `${standoutCount} repositories stand out clearly through stars or pinned placement.`
      : null,
  ]);
}

function buildSpecializationEvidence(
  scoring: ProfileScoringResult,
  locale: Locale,
) {
  const primary = scoring.primaryOrientation;
  const secondary = scoring.secondaryOrientation;
  const items = [];

  if (primary) {
    items.push(
      locale === "ko"
        ? `주 성향은 ${primary.label}이고 점수는 ${primary.score}/100입니다.`
        : `The clearest orientation is ${primary.label} at ${primary.score}/100.`,
    );
  }

  if (primary && secondary) {
    const gap = Math.max(0, primary.score - secondary.score);
    items.push(
      locale === "ko"
        ? `2순위 성향인 ${secondary.label}보다 ${gap}점 높습니다.`
        : `It stands ${gap} points above the second orientation, ${secondary.label}.`,
    );
  }

  return uniqueEvidence([...items, ...scoring.orientationEvidence]);
}

function buildMetricEvidence(
  metricId: BenchmarkMetricId,
  source: GitHubSourceData,
  featureSet: ProfileFeatureSet,
  scoring: ProfileScoringResult,
  locale: Locale,
) {
  switch (metricId) {
    case "activity":
      return buildActivityEvidence(source, locale);
    case "portfolioClarity":
      return buildPortfolioClarityEvidence(source, locale);
    case "specializationClarity":
      return buildSpecializationEvidence(scoring, locale);
    case "documentation":
    case "shipping":
    case "quality":
      return buildWorkingStyleEvidence(metricId, featureSet, locale);
  }
}

export function buildBenchmarkSnapshot(
  source: GitHubSourceData,
  featureSet: ProfileFeatureSet,
  scoring: ProfileScoringResult,
  locale: Locale,
): BenchmarkSnapshot {
  const cohortId = getCohortId(scoring);
  const cohort =
    benchmarkCohorts.find((item) => item.id === cohortId) ??
    benchmarkCohorts.find((item) => item.id === "generalist")!;
  const metricValues = getMetricValues(source, scoring);
  const conservative = shouldUseBandPresentation(scoring.confidence, cohort.sampleSize);
  const metrics = cohort.metrics.map((metric) => {
    const value = metricValues.find((item) => item.id === metric.id)?.value ?? 0;
    const label = localizeText(metric.label, locale);
    const percentile = estimatePercentile(value, metric.distribution);

    return {
      id: metric.id,
      label,
      note: buildMetricNote(percentile, label, locale, conservative),
      percentile,
      value: Math.round(value),
      evidence: buildMetricEvidence(
        metric.id as BenchmarkMetricId,
        source,
        featureSet,
        scoring,
        locale,
      ),
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
      conservative,
    ),
    metrics,
    overallPercentile: Math.max(1, Math.min(99, overallPercentile)),
    sampleSize: cohort.sampleSize,
  });
}
