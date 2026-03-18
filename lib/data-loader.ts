import "server-only";

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
import type { Locale } from "@/lib/schemas";
import {
  profileEngineConfigSchema,
  type LocalizedText,
} from "@/lib/schemas/rule-config";

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

export function localizeText(text: LocalizedText, locale: Locale) {
  return text[locale];
}
