import { z } from "zod";

export const repoIdentitySignalSourceSchema = z.enum([
  "repoName",
  "githubLanguage",
  "description",
  "topics",
  "rootFiles",
  "manifestContents",
  "readme",
  "recentCommitMessages",
]);

export const repoIdentityMatcherSchema = z.object({
  source: repoIdentitySignalSourceSchema,
  patterns: z.array(z.string().min(1)).min(1),
  matchMode: z.enum(["exact", "includes", "startsWith"]).default("exact"),
});

export const repoIdentityConditionSchema = z
  .object({
    all: z.array(repoIdentityMatcherSchema).default([]),
    any: z.array(repoIdentityMatcherSchema).default([]),
    none: z.array(repoIdentityMatcherSchema).default([]),
  })
  .refine(
    (value) =>
      value.all.length > 0 || value.any.length > 0 || value.none.length > 0,
    {
      message: "At least one of all/any/none must contain a matcher.",
    },
  );

const weightedLabelSchema = z.object({
  label: z.string().min(1),
  weight: z.number().positive(),
});

export const repoIdentityRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  when: repoIdentityConditionSchema,
  emit: z.object({
    languages: z.array(weightedLabelSchema).default([]),
    frameworks: z.array(weightedLabelSchema).default([]),
    surfaces: z.array(weightedLabelSchema).default([]),
    domains: z.array(weightedLabelSchema).default([]),
    flags: z.array(z.string().min(1)).default([]),
    confidenceDelta: z.number().min(-0.5).max(0.5).default(0),
  }),
});

export const repoIdentityRuleSetSchema = z.array(repoIdentityRuleSchema);

export type RepoIdentityRule = z.infer<typeof repoIdentityRuleSchema>;
export type RepoIdentityRuleSet = z.infer<typeof repoIdentityRuleSetSchema>;
export type RepoIdentitySignalSource = z.infer<
  typeof repoIdentitySignalSourceSchema
>;
