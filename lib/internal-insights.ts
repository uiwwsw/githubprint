import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { GitHubSourceData } from "@/lib/github";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import type { BenchmarkSnapshot, Locale } from "@/lib/schemas";

export type LearningSnapshot = {
  benchmark: {
    cohortId: string;
    confidenceScore: number;
    metrics: Array<{
      id: string;
      percentile: number;
      value: number;
    }>;
    overallPercentile: number;
    sampleSize: number;
  };
  generatedAt: string;
  locale: Locale;
  matchedSignalIds: string[];
  profile: {
    publicRepoCount: number;
    recentRepoCount: number;
    username: string;
  };
  representativeRepos: Array<{
    hasDemo: boolean;
    hasReadme: boolean;
    language: string | null;
    name: string;
    stars: number;
    topics: string[];
  }>;
  scoring: {
    orientationScores: Record<string, number>;
    primaryOrientationId: string | null;
    primaryWorkingStyleId: string | null;
    workingStyleScores: Record<string, number>;
  };
};

const INSIGHT_CAPTURE_DIR = path.join(
  process.cwd(),
  ".cache",
  "gitfolio",
  "insights",
);

export function buildLearningSnapshot(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  benchmark: BenchmarkSnapshot,
  locale: Locale,
): LearningSnapshot {
  return {
    benchmark: {
      cohortId: benchmark.cohortId,
      confidenceScore: benchmark.confidenceScore,
      metrics: benchmark.metrics.map((metric) => ({
        id: metric.id,
        percentile: metric.percentile,
        value: Math.round(metric.value),
      })),
      overallPercentile: benchmark.overallPercentile,
      sampleSize: benchmark.sampleSize,
    },
    generatedAt: new Date().toISOString(),
    locale,
    matchedSignalIds: scoring.matchedSignalIds,
    profile: {
      publicRepoCount: source.account.publicRepoCount,
      recentRepoCount: source.activity.recentRepoCount,
      username: source.account.username,
    },
    representativeRepos: source.representativeRepos.map((repo) => ({
      hasDemo: Boolean(repo.homepageUrl),
      hasReadme: Boolean(repo.readme),
      language: repo.language,
      name: repo.name,
      stars: repo.stars,
      topics: repo.topics,
    })),
    scoring: {
      orientationScores: scoring.orientationScores,
      primaryOrientationId: scoring.primaryOrientation?.id ?? null,
      primaryWorkingStyleId: scoring.primaryWorkingStyle?.id ?? null,
      workingStyleScores: scoring.workingStyleScores,
    },
  };
}

export async function captureLearningSnapshot(snapshot: LearningSnapshot) {
  if (process.env.GITFOLIO_CAPTURE_INSIGHTS !== "1") {
    return;
  }

  try {
    await mkdir(INSIGHT_CAPTURE_DIR, { recursive: true });
    const filePath = path.join(
      INSIGHT_CAPTURE_DIR,
      `${snapshot.profile.username.toLowerCase()}--${snapshot.generatedAt.replaceAll(/[:.]/g, "-")}.json`,
    );
    await writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch {
    // Insight capture is optional and should never break the request path.
  }
}
