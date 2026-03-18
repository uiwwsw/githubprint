import { z } from "zod";

export const localizedTextSchema = z.object({
  ko: z.string().min(1),
  en: z.string().min(1),
});

const contributionMapSchema = z.record(z.string(), z.number());

export const signalConfigSchema = z.object({
  id: z.string().min(1),
  matches: z.array(z.string().min(1)).min(1).optional(),
  matchMode: z.enum(["exact", "includes", "startsWith"]).default("exact"),
  contributions: z.object({
    orientations: contributionMapSchema.default({}),
    workingStyles: contributionMapSchema.default({}),
  }),
  evidence: localizedTextSchema.optional(),
});

export const orientationBandSchema = z.object({
  min: z.number().min(0).max(100),
  developerType: localizedTextSchema,
  headline: localizedTextSchema,
});

export const orientationCategorySchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  scoreCap: z.number().positive(),
  bands: z.array(orientationBandSchema).min(1),
});

export const workingStyleBandSchema = z.object({
  min: z.number().min(0).max(100),
  text: localizedTextSchema,
});

export const workingStyleCategorySchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  scoreCap: z.number().positive(),
  bands: z.array(workingStyleBandSchema).min(1),
});

export const strengthRuleSchema = z.object({
  id: z.string().min(1),
  priority: z.number().default(0),
  text: localizedTextSchema,
  minOrientationScores: contributionMapSchema.optional(),
  minWorkingStyleScores: contributionMapSchema.optional(),
  anySignals: z.array(z.string().min(1)).optional(),
  allSignals: z.array(z.string().min(1)).optional(),
});

export const roleRuleSchema = z.object({
  id: z.string().min(1),
  priority: z.number().default(0),
  text: localizedTextSchema,
  minOrientationScores: contributionMapSchema.optional(),
  minWorkingStyleScores: contributionMapSchema.optional(),
  anySignals: z.array(z.string().min(1)).optional(),
  allSignals: z.array(z.string().min(1)).optional(),
});

export const narrativeTemplatesSchema = z.object({
  generalist: z.object({
    headline: localizedTextSchema,
    developerType: localizedTextSchema,
  }),
  summary: z.object({
    high: localizedTextSchema,
    medium: localizedTextSchema,
    low: localizedTextSchema,
  }),
  caution: z.object({
    high: localizedTextSchema,
    medium: localizedTextSchema,
    low: localizedTextSchema,
  }),
  evidenceLabels: z.object({
    activity: localizedTextSchema,
    orientation: localizedTextSchema,
    workingStyle: localizedTextSchema,
    projects: localizedTextSchema,
  }),
  disclaimer: localizedTextSchema,
});

export const benchmarkDistributionSchema = z.object({
  p10: z.number().min(0).max(100),
  p25: z.number().min(0).max(100),
  p50: z.number().min(0).max(100),
  p75: z.number().min(0).max(100),
  p90: z.number().min(0).max(100),
});

export const benchmarkMetricSchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  distribution: benchmarkDistributionSchema,
});

export const benchmarkCohortSchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  sampleSize: z.number().int().positive(),
  metrics: z.array(benchmarkMetricSchema).min(1),
});

export const profileEngineConfigSchema = z.object({
  signals: z.object({
    languages: z.array(signalConfigSchema),
    topics: z.array(signalConfigSchema),
    files: z.array(signalConfigSchema),
    keywords: z.array(signalConfigSchema),
    commits: z.array(signalConfigSchema),
    meta: z.array(signalConfigSchema),
  }),
  rules: z.object({
    orientations: z.array(orientationCategorySchema),
    workingStyles: z.array(workingStyleCategorySchema),
    strengths: z.array(strengthRuleSchema),
    roles: z.array(roleRuleSchema),
  }),
  templates: narrativeTemplatesSchema,
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type SignalConfig = z.infer<typeof signalConfigSchema>;
export type OrientationCategory = z.infer<typeof orientationCategorySchema>;
export type WorkingStyleCategory = z.infer<typeof workingStyleCategorySchema>;
export type StrengthRule = z.infer<typeof strengthRuleSchema>;
export type RoleRule = z.infer<typeof roleRuleSchema>;
export type NarrativeTemplates = z.infer<typeof narrativeTemplatesSchema>;
export type BenchmarkDistribution = z.infer<typeof benchmarkDistributionSchema>;
export type BenchmarkMetricConfig = z.infer<typeof benchmarkMetricSchema>;
export type BenchmarkCohort = z.infer<typeof benchmarkCohortSchema>;
export type ProfileEngineConfig = z.infer<typeof profileEngineConfigSchema>;
