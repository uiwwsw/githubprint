import { z } from "zod";

export const templateSchema = z.enum(["brief", "profile", "insight"]);
export type TemplateId = z.infer<typeof templateSchema>;
export const localeSchema = z.enum(["ko", "en"]);
export type Locale = z.infer<typeof localeSchema>;
export type DataMode = "public" | "private_enriched";
export type PrivateExposureMode = "aggregate" | "include";
export type ContributionSummary = {
  endedAt: string;
  startedAt: string;
  totalCommitContributions: number;
  totalContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
};
export type AuthorizedPrivateRepoHighlight = {
  description: string;
  name: string;
  repoUrl: string;
  tech: string[];
  updatedAt: string;
  whyItStandsOut: string;
};
export type AuthorizedPrivateInsights = {
  authorizedRepoCount: number;
  automatedPrivateRepoCount: number;
  documentedPrivateRepoCount: number;
  hiddenRepresentativeCount: number;
  privateRepoCount: number;
  privateShowcaseRepos: AuthorizedPrivateRepoHighlight[];
  privateOnlyStack: string[];
  recentPrivateRepoCount: number;
  topPrivateDomains: string[];
  topPrivateStack: string[];
  topPrivateSurfaces: string[];
  verifiedPrivateRepoCount: number;
};

export const resultSearchParamsSchema = z.object({
  lang: localeSchema.optional(),
  refresh: z.string().optional(),
});

const optionalUrlSchema = z.union([z.url(), z.literal("")]);

export const benchmarkMetricSnapshotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  note: z.string().min(1),
  percentile: z.number().int().min(1).max(99),
  value: z.number().min(0).max(100),
  evidence: z.array(z.string().min(1)).max(3),
});

export const benchmarkSnapshotSchema = z.object({
  cohortId: z.string().min(1),
  cohortLabel: z.string().min(1),
  confidenceScore: z.number().int().min(0).max(100),
  insight: z.string().min(1),
  metrics: z.array(benchmarkMetricSnapshotSchema).min(3).max(6),
  overallPercentile: z.number().int().min(1).max(99),
  sampleSize: z.number().int().positive(),
});

export const analysisSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    username: z.string().min(1),
    avatarUrl: z.url(),
    headline: z.string().min(1),
    summary: z.string().min(1),
  }),
  facts: z.object({
    coreStack: z.array(z.string().min(1)).min(1).max(6),
    topLanguages: z.array(z.string().min(1)).min(1).max(6),
    publicRepoCount: z.number().int().nonnegative(),
    followers: z.number().int().nonnegative(),
    activityNote: z.string().min(1),
  }),
  inferred: z.object({
    developerType: z.string().min(1),
    workingStyle: z.string().min(1),
    strengths: z.array(z.string().min(1)).min(2).max(5),
    bestFitRoles: z.array(z.string().min(1)).min(2).max(5),
    cautionNote: z.string().min(1),
  }),
  projects: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        whyItMatters: z.string().min(1),
        tech: z.array(z.string().min(1)).min(1).max(8),
        repoUrl: z.url(),
        homepageUrl: optionalUrlSchema,
        stars: z.number().int().nonnegative(),
        updatedAt: z.string().min(1),
        evidence: z.string().min(1),
      }),
    )
    .max(5),
  evidence: z
    .array(
      z.object({
        label: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(3)
    .max(8),
  disclaimer: z.string().min(1),
});

export type GitHubPrintAnalysis = z.infer<typeof analysisSchema>;
export type GitFolioAnalysis = GitHubPrintAnalysis;
export type BenchmarkSnapshot = z.infer<typeof benchmarkSnapshotSchema>;
