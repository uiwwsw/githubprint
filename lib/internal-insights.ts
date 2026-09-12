import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PRODUCT_SLUG } from "@/lib/brand";
import { readEnv } from "@/lib/env";
import type { GitHubSourceData } from "@/lib/github";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import type { Locale } from "@/lib/schemas";

export type LearningSnapshot = {
  schemaVersion: 2;
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
  PRODUCT_SLUG,
  "insights",
);

export function buildLearningSnapshot(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  locale: Locale,
): LearningSnapshot {
  return {
    schemaVersion: 2,
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
  if (
    readEnv("GITHUBPRINT_CAPTURE_INSIGHTS", "GITFOLIO_CAPTURE_INSIGHTS") !== "1"
  ) {
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
