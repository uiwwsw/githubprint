import "server-only";

import { z } from "zod";
import rulesJson from "@/data/templates/introductions.json";
import { localizeText } from "@/lib/data-loader";
import { localizedTextSchema } from "@/lib/schemas/rule-config";
import { inferRepoIdentity } from "@/lib/repo-identity";
import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import type { Locale } from "@/lib/schemas";

const rules = z
  .object({
    specialties: z.array(
      z.object({
        id: z.string(),
        minScore: z.number(),
        minRepositories: z.number(),
        signals: z.array(z.string()),
        headline: localizedTextSchema,
        area: localizedTextSchema,
      }),
    ),
    patterns: z.array(
      z.object({
        id: z.enum([
          "published-docs",
          "verification",
          "documentation",
          "demo",
          "workspace",
        ]),
        minRepositories: z.number(),
        strength: localizedTextSchema,
        text: localizedTextSchema,
        reading: localizedTextSchema,
      }),
    ),
  })
  .parse(rulesJson);

function uniqueRepos(repos: GitHubRepoSnapshot[]) {
  return [
    ...new Map(
      repos.map((repo) => [repo.repoUrl.toLowerCase(), repo]),
    ).values(),
  ];
}

function list(values: string[], locale: Locale) {
  return locale === "ko"
    ? values.join(" · ")
    : new Intl.ListFormat("en", { type: "conjunction" }).format(values);
}

function names(repos: GitHubRepoSnapshot[], locale: Locale) {
  return list(
    repos
      .slice(0, 2)
      .map((repo) =>
        repo.visibility === "private"
          ? `${repo.name} (${locale === "ko" ? "비공개" : "Private"})`
          : repo.name,
      ),
    locale,
  );
}

function stack(repos: GitHubRepoSnapshot[]) {
  // These technologies belong to the cited repositories, not an unrelated account-wide stack.
  const perRepo = repos.map((repo) => {
    const identity =
      repo.identity ??
      inferRepoIdentity({
        ...repo,
        manifestContents: repo.manifestContents ?? [],
        githubLanguage: repo.language,
      });
    return [
      ...identity.frameworks.slice(0, 2),
      ...identity.languages.slice(0, 1),
    ].map((item) => item.label);
  });
  return [
    ...new Set([
      ...perRepo.flatMap((items) => items.slice(0, 1)),
      ...perRepo.flatMap((items) => items.slice(1)),
    ]),
  ].slice(0, 3);
}

const hasReadme = (repo: GitHubRepoSnapshot) => Boolean(repo.readme?.trim());
const hasProjectLink = (repo: GitHubRepoSnapshot) =>
  /^https?:\/\//i.test(repo.homepageUrl);
function matchesPattern(
  repo: GitHubRepoSnapshot,
  id: (typeof rules.patterns)[number]["id"],
) {
  const files = repo.rootFiles.map((file) => file.toLowerCase());
  switch (id) {
    case "published-docs":
      return hasReadme(repo) && hasProjectLink(repo);
    case "documentation":
      return hasReadme(repo);
    case "demo":
      return hasProjectLink(repo);
    case "verification":
      return files.some((file) =>
        /^(?:tests?|__tests__|spec|e2e)$|^(?:playwright|jest|vitest|cypress)\.config\./.test(
          file,
        ),
      );
    case "workspace":
      return files.some((file) =>
        /^(?:pnpm-workspace\.yaml|turbo\.json|lerna\.json|nx\.json)$/.test(
          file,
        ),
      );
  }
}

/** An introduction needs named project evidence, not popularity or a category score alone. */
export function buildProfileIntroduction(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  locale: Locale,
) {
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  // Defense in depth: anonymous private metadata is never a source of named examples.
  const canName = (repo: GitHubRepoSnapshot) =>
    !repo.isFork &&
    (repo.visibility === "public" ||
      (source.dataMode === "private_enriched" &&
        source.privateExposureMode === "include"));
  const repos = uniqueRepos([
    ...source.representativeRepos,
    ...(source.signalRepos ?? []),
    ...source.repos,
  ]).filter(canName);
  const allowed = new Set(repos.map((repo) => repo.repoUrl.toLowerCase()));
  const supported = rules.specialties
    .map((rule) => {
      const witnesses = uniqueRepos(
        scoring.repoFeatures
          .filter(({ repo, matchedSignals }) => {
            if (!allowed.has(repo.repoUrl.toLowerCase())) return false;
            const signals = matchedSignals.filter((signal) =>
              rule.signals.includes(signal.id),
            );
            // A topic or a keyword alone can express interest rather than implemented work.
            return (
              signals.some((signal) => signal.source === "file") ||
              new Set(signals.map((signal) => signal.source)).size >= 2
            );
          })
          .map(({ repo }) => repo),
      );
      return {
        rule,
        witnesses,
        score: scoring.orientationScores[rule.id] ?? 0,
      };
    })
    .filter(
      ({ rule, witnesses, score }) =>
        score >= rule.minScore && witnesses.length >= rule.minRepositories,
    )
    .sort((a, b) => b.score - a.score);
  // A close tie describes both areas instead of assigning an arbitrary single specialty.
  const focus = supported[0];
  const secondary =
    focus && supported[1] && focus.score - supported[1].score <= 10
      ? supported[1]
      : null;
  const areas = focus
    ? [
        localizeText(focus.rule.area, locale),
        ...(secondary ? [localizeText(secondary.rule.area, locale)] : []),
      ]
    : [];
  const examples = focus
    ? uniqueRepos([
        focus.witnesses[0],
        ...(secondary
          ? [
              secondary.witnesses.find(
                (repo) => repo.repoUrl !== focus.witnesses[0].repoUrl,
              ) ?? focus.witnesses[1],
            ]
          : focus.witnesses.slice(1)),
      ]).slice(0, 2)
    : repos.slice(0, 2);
  const technologies = stack(examples);
  const projectNames = names(examples, locale);
  const subject = list(areas, locale);
  const headline = secondary
    ? t(
        `${subject} 영역을 다루는 개발자`,
        `A developer working across ${subject}`,
      )
    : focus
      ? localizeText(focus.rule.headline, locale)
      : t("프로젝트로 보는 개발 기록", "A developer's work, through projects");
  const observations = rules.patterns.flatMap((rule) => {
    const witnesses = repos.filter((repo) => matchesPattern(repo, rule.id));
    if (witnesses.length < rule.minRepositories) return [];
    return [
      {
        id: rule.id,
        witnesses,
        text: localizeText(rule.text, locale)
          .replaceAll("{projects}", names(witnesses, locale))
          .replaceAll(
            "{include}",
            witnesses.length > 1 ? "include" : "includes",
          )
          .replaceAll(
            "{provide}",
            witnesses.length > 1 ? "provide" : "provides",
          ),
        strength: localizeText(rule.strength, locale),
        reading: localizeText(rule.reading, locale),
      },
    ];
  });
  // The combined observation already explains links and READMEs; do not repeat them.
  const patterns = observations.filter(
    (item) =>
      !observations.some((other) => other.id === "published-docs") ||
      !["demo", "documentation"].includes(item.id),
  );
  const technologyText = list(technologies, locale);
  const lead = !examples.length
    ? t(
        "현재 소개에 사용할 프로젝트 자료가 없습니다.",
        "No project evidence is currently available for an introduction.",
      )
    : focus
      ? t(
          `${technologyText ? `${technologyText} 기반의 ` : ""}${subject} 구현을 ${projectNames}에서 보여줍니다.`,
          `${projectNames} show implementations of ${subject}${technologyText ? ` with ${technologyText}` : ""}.`,
        )
      : t(
          `${projectNames}에서 ${technologyText ? `${technologyText} 기반의 구현을` : "프로젝트 구현을"} 살펴볼 수 있습니다.`,
          `${projectNames} ${examples.length > 1 ? "offer" : "offers"} a look at the implementation${technologyText ? ` with ${technologyText}` : ""}.`,
        );
  const scopeNote = focus
    ? t(
        "프로젝트의 기술과 구성을 바탕으로 정리한 소개입니다. 숙련도·담당 범위·업무 성과는 별도로 확인해야 합니다.",
        "This introduction reflects project technology and structure. Proficiency, responsibilities, and outcomes need separate verification.",
      )
    : t(
        "자료가 적거나 분야가 혼재해 특정 전문 분야나 작업 성향으로 규정하지 않았습니다.",
        "The evidence is limited or mixed, so no single specialty or working style is assigned.",
      );
  const firstPattern = patterns[0];
  const patternSummary =
    firstPattern &&
    Math.min(firstPattern.witnesses.length, 2) === examples.length &&
    firstPattern.witnesses
      .slice(0, 2)
      .every((repo) =>
        examples.some((example) => example.repoUrl === repo.repoUrl),
      )
      ? firstPattern.text.replace(
          names(firstPattern.witnesses, locale),
          t(
            firstPattern.witnesses.length > 1 ? "이들 프로젝트" : "이 프로젝트",
            firstPattern.witnesses.length > 1
              ? "These projects"
              : "This project",
          ),
        )
      : firstPattern?.text;
  const summary = [
    lead,
    patternSummary ??
      (!focus
        ? t(
            "확인된 작업을 소개하되, 이 자료만으로 전문 분야나 숙련도를 판단하지 않습니다.",
            "The introduction covers the available work without assigning a specialty or level of proficiency.",
          )
        : null),
  ]
    .filter(Boolean)
    .join(" ");
  const developerType = focus
    ? t(
        `${projectNames} 등 서로 다른 저장소에서 ${subject} 관련 구성이 확인되어 소개의 기준으로 삼았습니다.`,
        `The introduction is based on implementations involving ${subject} in distinct repositories, including ${projectNames}.`,
      )
    : scopeNote;
  const workingStyle =
    patterns
      .slice(1, 3)
      .map((item) => item.text)
      .join(" ") ||
    firstPattern?.reading ||
    t(
      "현재 자료로는 반복되는 작업 방식을 설명하기 어렵습니다.",
      "The available evidence does not establish a recurring working pattern.",
    );
  const strengths = [
    ...patterns.map((item) => item.strength),
    ...(technologies.length
      ? [
          t(
            `프로젝트에서 사용한 기술: ${technologyText}`,
            `Technologies used in the cited work: ${technologyText}`,
          ),
        ]
      : []),
    t(
      `소개에 참고한 프로젝트 ${repos.length}개`,
      `${repos.length} projects available for this introduction`,
    ),
    ...(!repos.length
      ? [
          t(
            "프로젝트 자료가 없어 유형 판단을 보류했습니다.",
            "No project evidence to support a developer classification.",
          ),
        ]
      : [
          t(
            "저장소에서 직접 확인할 수 있는 구현 내용",
            "Implementation available to inspect in the repositories",
          ),
        ]),
  ].slice(0, 4);
  return {
    headline,
    summary,
    developerType,
    workingStyle,
    strengths,
    cautionNote: scopeNote,
  };
}
