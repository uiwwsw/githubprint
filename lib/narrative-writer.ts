import "server-only";

import { localizeText } from "@/lib/data-loader";
import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import type { RepoFeature } from "@/lib/profile-features";
import type { ProfileScoringResult } from "@/lib/rule-engine";
import { analysisSchema, type GitFolioAnalysis, type Locale } from "@/lib/schemas";
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

function fillTemplate(
  template: string,
  replacements: Record<string, string>,
) {
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
  if (compact.length === 1) {
    return compact[0];
  }
  if (compact.length === 2) {
    return locale === "ko"
      ? `${compact[0]}와 ${compact[1]}`
      : `${compact[0]} and ${compact[1]}`;
  }
  const head = compact.slice(0, -1).join(", ");
  const tail = compact[compact.length - 1];
  return locale === "ko" ? `${head}, ${tail}` : `${head}, and ${tail}`;
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
    ? `${base} 보조적으로는 ${secondary.label} 관련 경험도 함께 보입니다.`
    : `${base} Secondary signals around ${secondary.label} are also visible.`;
}

function buildWorkingStyleText(
  scoring: ProfileScoringResult,
  locale: Locale,
) {
  const primary = scoring.primaryWorkingStyle;
  const secondary = scoring.secondaryWorkingStyle;

  if (!primary) {
    return locale === "ko"
      ? "작업 방식은 공개 저장소 기준으로는 제한적으로만 드러납니다."
      : "Working-style signals are only partially visible from public repositories.";
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
  const projectNames = source.representativeRepos.slice(0, 2).map((repo) => repo.name);

  return fillTemplate(template, {
    languages: joinReadable(
      source.topLanguages.slice(0, 3).map((item) => item.name),
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
        : locale === "ko"
          ? "주요 공개 저장소"
          : "visible public repositories",
  });
}

function buildFallbackStrengths(source: GitHubSourceData, locale: Locale) {
  const strengths: string[] = [];
  const primaryLanguage = source.topLanguages[0]?.name;

  if (primaryLanguage) {
    strengths.push(
      locale === "ko"
        ? `${primaryLanguage} 중심 구현 경험이 공개 저장소 전반에서 반복적으로 보입니다.`
        : `${primaryLanguage}-centered implementation work appears repeatedly across public repositories.`,
    );
  }
  strengths.push(
    locale === "ko"
      ? "대표 프로젝트를 기준으로 기술 선택과 관심 영역을 비교적 빠르게 파악할 수 있습니다."
      : "The standout repositories make recurring technical choices and interests relatively easy to read.",
  );
  strengths.push(
    locale === "ko"
      ? "공개 저장소 기준에서 구현 결과물이 지속적으로 축적된 흔적이 보입니다."
      : "Public repositories still show a visible pattern of accumulated implementation output.",
  );

  return strengths;
}

function buildFallbackRoles(
  scoring: ProfileScoringResult,
  locale: Locale,
) {
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
      locale === "ko" ? "모바일 제품 MVP 개발" : "Mobile MVP product development",
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
    locale === "ko"
      ? "초기 제품 MVP 구현"
      : "Early-stage MVP implementation",
  );
  fallback.push(
    locale === "ko"
      ? "작은 팀에서 여러 영역을 맡는 제품 개발 역할"
      : "General product development in smaller teams",
  );

  return fallback;
}

function localizeRepoEvidence(
  repoFeature: RepoFeature | undefined,
  locale: Locale,
) {
  if (!repoFeature) {
    return null;
  }

  const evidence = repoFeature.matchedSignals
    .filter((signal) => signal.evidence)
    .map((signal) => localizeText(signal.evidence!, locale));

  if (evidence.length === 0) {
    return null;
  }

  return [...new Set(evidence)].slice(0, 2).join(" ");
}

function buildProjects(
  source: GitHubSourceData,
  repoFeatureMap: Map<string, RepoFeature>,
  locale: Locale,
) {
  return source.representativeRepos.slice(0, 5).map((repo) => {
    const repoFeature = repoFeatureMap.get(repo.name.toLowerCase());
    const evidenceText = localizeRepoEvidence(repoFeature, locale);

    return {
      description:
        repo.description ??
        (locale === "ko"
          ? "설명이 짧아 저장소 이름과 구조 중심으로만 해석 가능합니다."
          : "The description is limited, so interpretation relies mostly on the repository name and structure."),
      evidence:
        evidenceText ??
        (repo.readme && repo.readme.length > 280
          ? locale === "ko"
            ? "README와 저장소 메타데이터가 함께 확인됩니다."
            : "Both the README and repository metadata are visible."
          : locale === "ko"
            ? "저장소 설명, stars, 최근 업데이트 시점을 기준으로 선정했습니다."
            : "Selection is based on repository description, stars, and recent update timing."),
      homepageUrl: repo.homepageUrl,
      name: repo.name,
      repoUrl: repo.repoUrl,
      stars: repo.stars,
      tech:
        (() => {
          const tech = [
            ...new Set([
              ...repo.techSignals,
              ...repo.topics,
              ...(repo.language ? [repo.language] : []),
            ]),
          ].slice(0, 8);

          return tech.length > 0 ? tech : ["GitHub"];
        })(),
      updatedAt: repo.updatedAt,
      whyItMatters: evidenceText
        ? locale === "ko"
          ? `대표작 후보로 볼 만한 저장소이며, ${evidenceText}`
          : `This looks like a standout project candidate, and ${evidenceText.charAt(0).toLowerCase()}${evidenceText.slice(1)}`
        : repo.isPinned || repo.stars > 0
          ? locale === "ko"
            ? `대표작 후보로 보이는 저장소입니다. ${repoSignalText(repo, locale)}.`
            : `This repository looks like a standout project candidate. ${repoSignalText(repo, locale)}.`
          : locale === "ko"
            ? `최근 작업 흐름을 보여주는 저장소입니다. ${repoSignalText(repo, locale)}.`
            : `This repository helps show the recent flow of work. ${repoSignalText(repo, locale)}.`,
    };
  });
}

export function buildRuleBasedAnalysis(
  source: GitHubSourceData,
  scoring: ProfileScoringResult,
  config: ProfileEngineConfig,
  locale: Locale,
): GitFolioAnalysis {
  const name = source.account.name ?? source.account.username;
  const repoFeatureMap = new Map(
    scoring.repoFeatures.map((item) => [item.repo.name.toLowerCase(), item] as const),
  );
  const strengths = [
    ...scoring.strengths,
    ...buildFallbackStrengths(source, locale),
  ].slice(0, 4);
  const roles = [...scoring.roles, ...buildFallbackRoles(scoring, locale)].slice(0, 4);
  const topLanguages = source.topLanguages.map((item) => item.name).slice(0, 6);
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
    {
      detail:
        source.representativeRepos.length > 0
          ? source.representativeRepos
              .slice(0, 3)
              .map((repo) => `${repo.name}: ${repoSignalText(repo, locale)}`)
              .join(" / ")
          : locale === "ko"
            ? "대표 프로젝트로 볼 만한 공개 저장소가 충분하지 않습니다."
            : "There are not enough public repositories to identify standout projects confidently.",
      label: localizeText(config.templates.evidenceLabels.projects, locale),
    },
  ];

  source.evidenceSignals.slice(0, 2).forEach((signal, index) => {
    evidence.push({
      detail: signal,
      label: locale === "ko" ? `추가 근거 ${index + 1}` : `Additional evidence ${index + 1}`,
    });
  });

  return analysisSchema.parse({
    disclaimer: localizeText(config.templates.disclaimer, locale),
    evidence: evidence.slice(0, 6),
    facts: {
      activityNote: source.activity.note,
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
    projects: buildProjects(source, repoFeatureMap, locale),
  });
}
