import "server-only";

import { existsSync, readFileSync } from "fs";
import benchmarkCohortsJson from "@/data/benchmarks/cohorts.json";
import repoIdentityPresentationRulesJson from "@/data/repo-identity/presentation-rules.json";
import repoIdentityRulesJson from "@/data/repo-identity/rules.json";
import commitSignals from "@/data/signals/commits.json";
import fileSignals from "@/data/signals/files.json";
import keywordSignals from "@/data/signals/keywords.json";
import languageSignals from "@/data/signals/languages.json";
import metaSignals from "@/data/signals/meta.json";
import topicSignals from "@/data/signals/topics.json";
import orientations from "@/data/rules/orientations.json";
import roles from "@/data/rules/roles.json";
import strengths from "@/data/rules/strengths.json";
import workingStyles from "@/data/rules/working-styles.json";
import narratives from "@/data/templates/narratives.json";
import { readEnv } from "@/lib/env";
import type { Locale } from "@/lib/schemas";
import {
  benchmarkCohortSchema,
  profileEngineConfigSchema,
  type LocalizedText,
} from "@/lib/schemas/rule-config";
import {
  repoIdentityPresentationRuleSetSchema,
  repoIdentityRuleSetSchema,
} from "@/lib/schemas/repo-identity";

export const profileEngineConfig = profileEngineConfigSchema.parse({
  signals: {
    commits: commitSignals,
    files: fileSignals,
    keywords: keywordSignals,
    languages: languageSignals,
    meta: metaSignals,
    topics: topicSignals,
  },
  rules: {
    orientations,
    roles,
    strengths,
    workingStyles,
  },
  templates: narratives,
});

export const repoIdentityRules = repoIdentityRuleSetSchema.parse(
  repoIdentityRulesJson,
);

export const repoIdentityPresentationRules =
  repoIdentityPresentationRuleSetSchema.parse(
    repoIdentityPresentationRulesJson,
  );

function loadBenchmarkCohorts() {
  const overridePath = readEnv(
    "GITHUBPRINT_BENCHMARK_OVERRIDE_PATH",
    "GITFOLIO_BENCHMARK_OVERRIDE_PATH",
  );

  if (overridePath && existsSync(overridePath)) {
    const file = readFileSync(overridePath, "utf-8");
    return JSON.parse(file) as unknown;
  }

  return benchmarkCohortsJson;
}

export const benchmarkCohorts = benchmarkCohortSchema.array().parse(
  loadBenchmarkCohorts(),
);

export function localizeText(text: LocalizedText, locale: Locale) {
  return text[locale];
}
