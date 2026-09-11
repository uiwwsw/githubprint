import "server-only";

import { localizeText } from "@/lib/data-loader";
import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import { buildRepoTechStack, summarizeRepoStack } from "@/lib/repo-identity";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import {
  analysisSchema,
  type GitHubPrintAnalysis,
  type Locale,
} from "@/lib/schemas";
import type { ProfileEngineConfig } from "@/lib/schemas/rule-config";

function repoSignalText(repo: GitHubRepoSnapshot, locale: Locale) {
  const parts = [
    `${repo.stars} stars`,
    repo.readme
      ? locale === "ko"
        ? "README 있음"
        : "README available"
      : locale === "ko"
        ? "README 없음"
        : "README missing",
    repo.homepageUrl
      ? locale === "ko"
        ? "demo/homepage 있음"
        : "demo/homepage available"
      : null,
    repo.isPinned ? "pinned repo" : null,
    repo.language
      ? locale === "ko"
        ? `주 언어 ${repo.language}`
        : `primary language ${repo.language}`
      : null,
  ].filter(Boolean);

  return parts.join(" / ");
}

function fillTemplate(template: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function joinReadable(values: string[], locale: Locale) {
  const compact = values.filter(Boolean);
  if (compact.length === 0) {
    return locale === "ko" ? "여러 기술" : "multiple technologies";
  }
  return locale === "ko"
    ? compact.join(" · ")
    : new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
        compact,
      );
}

function localizePrivateFacet(value: string, locale: Locale) {
  if (locale === "ko") {
    if (value === "frontend") return "프론트엔드";
    if (value === "backend") return "백엔드";
    if (value === "mobile") return "모바일";
    if (value === "devtools") return "개발툴";
    if (value === "docs") return "문서";
    if (value === "Automation") return "자동화";
  }

  if (value === "devtools") {
    return locale === "ko" ? "개발툴" : "developer tooling";
  }
  if (value === "docs") {
    return locale === "ko" ? "문서" : "documentation";
  }
  if (value === "Automation") {
    return locale === "ko" ? "자동화" : "automation";
  }

  return value;
}

function getStackSummary(source: GitHubSourceData) {
  return source.stackSummary ?? summarizeRepoStack(source.repos);
}

function buildDeveloperTypeText(
  scoring: ProfileScoringResult,
  config: ProfileEngineConfig,
  locale: Locale,
) {
  const primary = scoring.primaryOrientation;
  const secondary = scoring.secondaryOrientation;
  const base =
    primary && primary.score >= 45
      ? primary.developerType
      : localizeText(config.templates.generalist.developerType, locale);

  if (!secondary || secondary.id === primary?.id || secondary.score < 50) {
    return base;
  }

  return locale === "ko"
    ? `${base} ${secondary.label} 관련 구현도 함께 확인됩니다.`
    : `${base} The work also includes ${secondary.label} implementation.`;
}

function buildWorkingStyleText(scoring: ProfileScoringResult, locale: Locale) {
  const primary = scoring.primaryWorkingStyle;
  const secondary = scoring.secondaryWorkingStyle;

  if (!primary) {
    return locale === "ko"
      ? "작업 방식은 공개 저장소 기준으로는 제한적으로만 드러납니다."
      : "Working-style signals are only partially visible from repositories.";
  }

  if (!secondary || secondary.id === primary.id || secondary.score < 45) {
    return primary.text;
  }

  return `${primary.text} ${secondary.text}`;
}

function buildSummaryText(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  config: ProfileEngineConfig,
  locale: Locale,
) {
  const template = localizeText(
    config.templates.summary[scoring.confidenceBand],
    locale,
  );
  const projectNames = source.representativeRepos
    .slice(0, 2)
    .map((repo) => repo.name);
  const stackSummary = getStackSummary(source);
  const projectFallback =
    source.dataMode === "private_enriched"
      ? locale === "ko"
        ? "주요 저장소"
        : "visible repositories"
      : locale === "ko"
        ? "주요 공개 저장소"
        : "visible public repositories";

  if (!projectNames.length && source.repos.length === 0) {
    return locale === "ko"
      ? "현재 확인할 수 있는 프로젝트가 없습니다. 저장소에 설명과 사용 기술을 남기면 다음 문서에 반영됩니다."
      : "No projects are currently available to describe. Repository descriptions and technologies can be included when available.";
  }

  const base = fillTemplate(template, {
    languages: joinReadable(
      (stackSummary.coreStack.length > 0
        ? stackSummary.coreStack
        : source.topLanguages.slice(0, 3).map((item) => item.name)
      ).slice(0, 3),
      locale,
    ),
    name: source.account.name ?? source.account.username,
    primaryOrientation:
      scoring.primaryOrientation?.label ??
      (locale === "ko" ? "폭넓은 구현" : "general implementation"),
    primaryStyle:
      scoring.primaryWorkingStyle?.label ??
      (locale === "ko" ? "구현 중심 작업" : "implementation-led work"),
    projects:
      projectNames.length > 0
        ? joinReadable(projectNames, locale)
        : projectFallback,
  });

  if (
    source.dataMode !== "private_enriched" ||
    !source.authorizedPrivateInsights
  ) {
    return base;
  }

  const insights = source.authorizedPrivateInsights;

  if (insights.privateOnlyStack.length > 0) {
    return `${base} ${
      locale === "ko"
        ? `선택한 비공개 작업에서 ${joinReadable(
            insights.privateOnlyStack.slice(0, 2),
            locale,
          )} 기술도 확인됩니다.`
        : `Selected private work also uses ${joinReadable(
            insights.privateOnlyStack.slice(0, 2),
            locale,
          )}.`
    }`;
  }

  if (insights.topPrivateSurfaces.length > 0) {
    return `${base} ${
      locale === "ko"
        ? `선택한 비공개 저장소에는 ${joinReadable(
            insights.topPrivateSurfaces
              .slice(0, 2)
              .map((item) => localizePrivateFacet(item, locale)),
            locale,
          )} 관련 작업도 있습니다.`
        : `Selected private repositories also include ${joinReadable(
            insights.topPrivateSurfaces
              .slice(0, 2)
              .map((item) => localizePrivateFacet(item, locale)),
            locale,
          )} work.`
    }`;
  }

  return base;
}

function buildFallbackStrengths(source: GitHubSourceData, locale: Locale) {
  const stack = getStackSummary(source).coreStack.slice(0, 3);
  const projects = source.representativeRepos;
  return [
    stack.length
      ? locale === "ko"
        ? `확인된 기술: ${stack.join(" · ")}`
        : `Technologies: ${stack.join(" · ")}`
      : locale === "ko"
        ? "주력 기술을 판단할 자료가 적습니다."
        : "There is little evidence to identify a main stack.",
    projects.length
      ? locale === "ko"
        ? `살펴볼 수 있는 대표 프로젝트 ${projects.length}개`
        : `${projects.length} selected projects to explore`
      : locale === "ko"
        ? "프로젝트 소개에 필요한 자료가 적습니다."
        : "Project information is limited.",
  ];
}

function buildFallbackRoles(scoring: ProfileScoringResult, locale: Locale) {
  const fallback: string[] = [];

  if (scoring.primaryOrientation?.id === "frontend") {
    fallback.push(
      locale === "ko"
        ? "제품 중심 프론트엔드 개발"
        : "Product-focused frontend development",
    );
  } else if (scoring.primaryOrientation?.id === "backend") {
    fallback.push(
      locale === "ko"
        ? "API 및 서비스 구조 설계 역할"
        : "API and service architecture roles",
    );
  } else if (scoring.primaryOrientation?.id === "mobile") {
    fallback.push(
      locale === "ko"
        ? "모바일 제품 MVP 개발"
        : "Mobile MVP product development",
    );
  } else if (scoring.primaryOrientation?.id === "ai") {
    fallback.push(
      locale === "ko"
        ? "AI 기능 제품화 실험"
        : "AI feature productization experiments",
    );
  } else if (scoring.primaryOrientation?.id === "devtools") {
    fallback.push(
      locale === "ko"
        ? "개발 워크플로우와 툴링 개선 역할"
        : "Developer workflow and tooling improvement work",
    );
  }

  fallback.push(
    locale === "ko" ? "초기 제품 MVP 구현" : "Early-stage MVP implementation",
  );
  fallback.push(
    locale === "ko"
      ? "프로젝트 구현과 기술 문서 정리"
      : "Project implementation and technical documentation",
  );

  return fallback;
}

function buildProjects(source: GitHubSourceData, locale: Locale) {
  return source.representativeRepos.slice(0, 5).map((repo) => {
    const inspectedFiles = repo.rootFiles
      .filter((name) =>
        /^(readme|package\.json|src$|app$|tests?$|__tests__$|docs?$|cargo\.toml|pyproject\.toml|go\.mod)/i.test(
          name,
        ),
      )
      .slice(0, 4);

    return {
      description:
        repo.description ??
        (locale === "ko"
          ? "프로젝트 설명이 아직 없습니다. 구현 내용은 저장소에서 확인할 수 있습니다."
          : "No project description is available. Explore the implementation in the repository."),
      evidence: inspectedFiles.length
        ? locale === "ko"
          ? `살펴본 구성: ${inspectedFiles.join(" · ")}`
          : `Repository structure: ${inspectedFiles.join(" · ")}`
        : locale === "ko"
          ? "저장소의 설명과 기술 정보를 참고했습니다."
          : "Based on the repository description and technology information.",
      homepageUrl: repo.homepageUrl,
      name:
        repo.visibility === "private"
          ? `${repo.name} (${locale === "ko" ? "비공개" : "Private"})`
          : repo.name,
      repoUrl: repo.repoUrl,
      stars: repo.stars,
      tech: (() => {
        const tech = buildRepoTechStack({
          description: repo.description,
          githubLanguage: repo.language,
          identity: repo.identity,
          manifestContents: repo.manifestContents,
          name: repo.name,
          readme: repo.readme,
          recentCommitMessages: repo.recentCommitMessages,
          rootFiles: repo.rootFiles,
          topics: repo.topics,
        });

        return tech.length > 0 ? tech : ["GitHub"];
      })(),
      updatedAt: repo.updatedAt,
      whyItMatters: repo.isPinned
        ? locale === "ko"
          ? "GitHub 프로필에 고정한 프로젝트입니다."
          : "Pinned on the author's GitHub profile."
        : repo.homepageUrl
          ? locale === "ko"
            ? "연결된 서비스에서 결과물을 살펴볼 수 있습니다."
            : "The linked site offers a closer look at the work."
          : repo.readme
            ? locale === "ko"
              ? "README에서 프로젝트 설명을 읽을 수 있습니다."
              : "The README provides further project context."
            : locale === "ko"
              ? "저장소에서 구현 내용을 확인할 수 있습니다."
              : "Explore the implementation in the repository.",
    };
  });
}

function buildPrivateEvidenceEntries(source: GitHubSourceData, locale: Locale) {
  if (
    source.dataMode !== "private_enriched" ||
    !source.authorizedPrivateInsights
  ) {
    return [];
  }

  const insights = source.authorizedPrivateInsights;
  const entries: Array<{ detail: string; label: string }> = [];

  if (
    insights.privateOnlyStack.length > 0 ||
    insights.topPrivateSurfaces.length > 0 ||
    insights.topPrivateDomains.length > 0
  ) {
    entries.push({
      detail:
        insights.privateOnlyStack.length > 0
          ? locale === "ko"
            ? `비공개 저장소를 함께 읽으면 공개 결과에 덜 드러나던 ${joinReadable(
                insights.privateOnlyStack.slice(0, 3),
                locale,
              )} 같은 스택이 추가로 보입니다.`
            : `Including private repositories reveals additional stack signals such as ${joinReadable(
                insights.privateOnlyStack.slice(0, 3),
                locale,
              )} that are less visible in public work.`
          : locale === "ko"
            ? insights.topPrivateSurfaces.length > 0 &&
              insights.topPrivateDomains.length > 0
              ? `비공개 저장소를 함께 보면 ${joinReadable(
                  insights.topPrivateSurfaces
                    .slice(0, 2)
                    .map((item) => localizePrivateFacet(item, locale)),
                  locale,
                )} 성격과 ${joinReadable(
                  insights.topPrivateDomains
                    .slice(0, 2)
                    .map((item) => localizePrivateFacet(item, locale)),
                  locale,
                )} 도메인이 조금 더 선명해집니다.`
              : insights.topPrivateSurfaces.length > 0
                ? `비공개 저장소를 함께 보면 ${joinReadable(
                    insights.topPrivateSurfaces
                      .slice(0, 2)
                      .map((item) => localizePrivateFacet(item, locale)),
                    locale,
                  )} 성격이 조금 더 선명해집니다.`
                : `비공개 저장소를 함께 보면 ${joinReadable(
                    insights.topPrivateDomains
                      .slice(0, 2)
                      .map((item) => localizePrivateFacet(item, locale)),
                    locale,
                  )} 도메인이 조금 더 선명해집니다.`
            : insights.topPrivateSurfaces.length > 0 &&
                insights.topPrivateDomains.length > 0
              ? `Private repositories make ${joinReadable(
                  insights.topPrivateSurfaces
                    .slice(0, 2)
                    .map((item) => localizePrivateFacet(item, locale)),
                  locale,
                )} surfaces and ${joinReadable(
                  insights.topPrivateDomains
                    .slice(0, 2)
                    .map((item) => localizePrivateFacet(item, locale)),
                  locale,
                )} domains a bit clearer.`
              : insights.topPrivateSurfaces.length > 0
                ? `Private repositories make ${joinReadable(
                    insights.topPrivateSurfaces
                      .slice(0, 2)
                      .map((item) => localizePrivateFacet(item, locale)),
                    locale,
                  )} surfaces a bit clearer.`
                : `Private repositories make ${joinReadable(
                    insights.topPrivateDomains
                      .slice(0, 2)
                      .map((item) => localizePrivateFacet(item, locale)),
                    locale,
                  )} domains a bit clearer.`,
      label: locale === "ko" ? "비공개 추가 패턴" : "Private additions",
    });
  }

  if (
    insights.documentedPrivateRepoCount > 0 ||
    insights.verifiedPrivateRepoCount > 0 ||
    insights.automatedPrivateRepoCount > 0
  ) {
    entries.push({
      detail:
        locale === "ko"
          ? `비공개 저장소 기준으로 문서 흔적 ${insights.documentedPrivateRepoCount}개, 검증 흔적 ${insights.verifiedPrivateRepoCount}개, 자동화 흔적 ${insights.automatedPrivateRepoCount}개가 보수적으로 확인됩니다.`
          : `Across private repositories, ${insights.documentedPrivateRepoCount} show documentation traces, ${insights.verifiedPrivateRepoCount} show validation traces, and ${insights.automatedPrivateRepoCount} show automation traces by conservative reading.`,
      label:
        locale === "ko" ? "비공개 구현 단서" : "Private implementation signals",
    });
  }

  return entries;
}

export function buildRuleBasedAnalysis(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  config: ProfileEngineConfig,
  locale: Locale,
): GitHubPrintAnalysis {
  const name = source.account.name ?? source.account.username;
  const strengths = [
    ...scoring.strengths,
    ...buildFallbackStrengths(source, locale),
  ].slice(0, 4);
  const roles = [
    ...scoring.roles,
    ...buildFallbackRoles(scoring, locale),
  ].slice(0, 4);
  const stackSummary = getStackSummary(source);
  const topLanguages =
    stackSummary.topLanguages.length > 0
      ? stackSummary.topLanguages.slice(0, 6)
      : source.topLanguages.map((item) => item.name).slice(0, 6);
  const coreStack =
    stackSummary.coreStack.length > 0
      ? stackSummary.coreStack.slice(0, 6)
      : topLanguages.length > 0
        ? topLanguages
        : ["GitHub"];
  const headline =
    scoring.primaryOrientation && scoring.primaryOrientation.score >= 45
      ? scoring.primaryOrientation.headline
      : localizeText(config.templates.generalist.headline, locale);
  const evidence = [
    {
      detail: source.activity.note,
      label: localizeText(config.templates.evidenceLabels.activity, locale),
    },
    {
      detail:
        scoring.orientationEvidence.join(" ") ||
        source.evidenceSignals[0] ||
        (locale === "ko"
          ? "공개 저장소의 언어, topic, 파일 구조를 종합해 유형을 추정했습니다."
          : "Orientation is inferred from public language, topic, and repository-structure signals."),
      label: localizeText(config.templates.evidenceLabels.orientation, locale),
    },
    {
      detail:
        scoring.workingStyleEvidence.join(" ") ||
        source.evidenceSignals[1] ||
        (locale === "ko"
          ? "README, 활동 흐름, 설정 파일, commit 메시지를 함께 보며 작업 방식을 추정했습니다."
          : "Working style is inferred from README quality, activity patterns, configuration files, and commit messages."),
      label: localizeText(config.templates.evidenceLabels.workingStyle, locale),
    },
    ...buildPrivateEvidenceEntries(source, locale),
    {
      detail:
        source.representativeRepos.length > 0
          ? source.representativeRepos
              .slice(0, 3)
              .map((repo) => `${repo.name}: ${repoSignalText(repo, locale)}`)
              .join(" / ")
          : locale === "ko"
            ? "대표 프로젝트로 볼 만한 저장소가 충분하지 않습니다."
            : "There are not enough repositories to identify standout projects confidently.",
      label: localizeText(config.templates.evidenceLabels.projects, locale),
    },
  ];

  source.evidenceSignals.slice(0, 2).forEach((signal, index) => {
    evidence.push({
      detail: signal,
      label:
        locale === "ko"
          ? `추가 근거 ${index + 1}`
          : `Additional evidence ${index + 1}`,
    });
  });

  return analysisSchema.parse({
    disclaimer:
      source.dataMode === "private_enriched"
        ? locale === "ko"
          ? "이 문서는 공개 자료와 사용자가 선택한 비공개 작업을 바탕으로 작성되었습니다. 비공개 작업은 선택한 공개 범위로만 표시하며, 벤치마크는 공개 근거만 사용합니다. 경력, 협업 능력, 비즈니스 성과를 단정하지 않습니다."
          : "This document uses public sources and selected private work, displayed at the chosen level of detail. Benchmarks use only public evidence. Career tenure, collaboration quality, and business impact are not asserted."
        : localizeText(config.templates.disclaimer, locale),
    evidence: evidence.slice(0, 6),
    facts: {
      activityNote: source.activity.note,
      coreStack,
      followers: source.account.followers,
      publicRepoCount: source.account.publicRepoCount,
      topLanguages: topLanguages.length > 0 ? topLanguages : ["GitHub"],
    },
    inferred: {
      bestFitRoles:
        roles.length >= 2
          ? roles
          : [...roles, ...buildFallbackRoles(scoring, locale)].slice(0, 2),
      cautionNote: localizeText(
        config.templates.caution[scoring.confidenceBand],
        locale,
      ),
      developerType: buildDeveloperTypeText(scoring, config, locale),
      strengths:
        strengths.length >= 2
          ? strengths
          : buildFallbackStrengths(source, locale).slice(0, 2),
      workingStyle: buildWorkingStyleText(scoring, locale),
    },
    profile: {
      avatarUrl: source.account.avatarUrl,
      headline,
      name,
      summary: buildSummaryText(source, scoring, config, locale),
      username: source.account.username,
    },
    projects: buildProjects(source, locale),
  });
}
