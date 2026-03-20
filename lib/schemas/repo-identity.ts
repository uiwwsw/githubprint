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

const presentationLabelListSchema = z.array(z.string().min(1)).default([]);

export const repoIdentityPresentationConditionSchema = z
  .object({
    domainsAll: presentationLabelListSchema,
    domainsAny: presentationLabelListSchema,
    frameworksAll: presentationLabelListSchema,
    frameworksAny: presentationLabelListSchema,
    githubLanguagesAll: presentationLabelListSchema,
    githubLanguagesAny: presentationLabelListSchema,
    languagesAll: presentationLabelListSchema,
    languagesAny: presentationLabelListSchema,
    rootFilesAll: presentationLabelListSchema,
    rootFilesAny: presentationLabelListSchema,
    surfacesAll: presentationLabelListSchema,
    surfacesAny: presentationLabelListSchema,
    topicsAll: presentationLabelListSchema,
    topicsAny: presentationLabelListSchema,
  })
  .refine(
    (value) => Object.values(value).some((items) => items.length > 0),
    {
      message: "At least one presentation matcher must be configured.",
    },
  );

const repoIdentityPresentationAliasSchema = z.object({
  from: z.array(z.string().min(1)).min(1),
  to: z.string().min(1),
});

export const repoIdentityPresentationRuleSchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  priority: z.number().int().min(0).default(0),
  transform: z
    .object({
      aliasLabels: z.array(repoIdentityPresentationAliasSchema).default([]),
      preferLabels: z.array(z.string().min(1)).default([]),
    })
    .refine(
      (value) => value.aliasLabels.length > 0 || value.preferLabels.length > 0,
      {
        message: "At least one presentation transform must be configured.",
      },
    ),
  when: repoIdentityPresentationConditionSchema,
});

export const repoIdentityPresentationRuleSetSchema = z.array(
  repoIdentityPresentationRuleSchema,
);

export type RepoIdentityRule = z.infer<typeof repoIdentityRuleSchema>;
export type RepoIdentityRuleSet = z.infer<typeof repoIdentityRuleSetSchema>;
export type RepoIdentityPresentationRule = z.infer<
  typeof repoIdentityPresentationRuleSchema
>;
export type RepoIdentityPresentationRuleSet = z.infer<
  typeof repoIdentityPresentationRuleSetSchema
>;
export type RepoIdentitySignalSource = z.infer<
  typeof repoIdentitySignalSourceSchema
>;
