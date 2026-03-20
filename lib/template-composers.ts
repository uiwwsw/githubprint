import type {
  BenchmarkSnapshot,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
} from "@/lib/schemas";

type BenchmarkMetric = BenchmarkSnapshot["metrics"][number];

export type BriefTemplateView = {
  headline: string;
  summary: string;
  highlights: string[];
  activityNote: string;
  topMetrics: BenchmarkMetric[];
};

export type InsightProjectReading = {
  name: string;
  narrative: string;
  repoUrl: string;
  homepageUrl: string;
};

export type ProfileTemplateView = {
  summary: string;
  projectLead: string;
  techNarrative: string;
  benchmarkNarrative: string;
  strengthsLead: string;
  roleLead: string;
};

export type InsightTemplateView = {
  opening: string;
  patternReading: string;
  fitNarrative: string;
  benchmarkNarrative: string;
  techNarrative: string;
  projectReadings: InsightProjectReading[];
};

function firstSentences(text: string, count: number) {
  const sentences =
    text.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

  if (sentences.length === 0) {
    return text.trim();
  }

  return sentences.slice(0, count).join(" ");
}

function joinReadable(items: string[], locale: Locale) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  return locale === "ko"
    ? `${items.slice(0, -1).join(", ")}와 ${items[items.length - 1]}`
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function composeBriefTemplateView(
  analysis: GitHubPrintAnalysis,
  benchmark: BenchmarkSnapshot,
  locale: Locale,
  dataMode: DataMode = "public",
): BriefTemplateView {
  const stackText = joinReadable(analysis.facts.coreStack.slice(0, 2), locale);

  return {
    headline:
      stackText.length > 0
        ? locale === "ko"
          ? `${stackText} 중심 프로젝트 요약`
          : `A quick snapshot of ${stackText}-centered work`
        : locale === "ko"
          ? dataMode === "private_enriched"
            ? "승인된 GitHub 활동 요약"
            : "공개 GitHub 활동 요약"
          : dataMode === "private_enriched"
            ? "A quick snapshot of authorized GitHub work"
            : "A quick snapshot of public GitHub work",
    summary: firstSentences(analysis.profile.summary, 2),
    highlights: analysis.evidence.slice(0, 4).map((item) => item.detail),
    activityNote: analysis.facts.activityNote,
    topMetrics: [...benchmark.metrics]
      .sort((left, right) => right.percentile - left.percentile)
      .slice(0, 2),
  };
}

export function composeInsightTemplateView(
  analysis: GitHubPrintAnalysis,
  benchmark: BenchmarkSnapshot,
  locale: Locale,
): InsightTemplateView {
  const strengths = analysis.inferred.strengths.slice(0, 2);
  const roles = analysis.inferred.bestFitRoles.slice(0, 2);
  const coreStack = analysis.facts.coreStack.slice(0, 3);
  const strengthText = joinReadable(strengths, locale);
  const roleText = joinReadable(roles, locale);
  const stackText = joinReadable(coreStack, locale);

  const fitNarrative =
    locale === "ko"
      ? `${strengthText} 쪽이 특히 두드러지며, ${roleText} 같은 역할과의 접점도 보입니다. ${analysis.inferred.cautionNote}`
      : `${strengthText} stand out most clearly, and the profile also shows a reasonable fit with roles such as ${roleText}. ${analysis.inferred.cautionNote}`;

  const benchmarkNarrative =
    locale === "ko"
      ? `${benchmark.cohortLabel} 기준으로 보면 ${benchmark.insight}`
      : `Against the ${benchmark.cohortLabel}, ${benchmark.insight}`;

  const techNarrative =
    locale === "ko"
      ? `핵심 기술 흐름은 ${stackText} 중심으로 보입니다. ${analysis.facts.activityNote}`
      : `The clearest technical throughline runs through ${stackText}. ${analysis.facts.activityNote}`;

  const projectReadings = analysis.projects.map((project) => {
    const projectTechText = joinReadable(project.tech.slice(0, 3), locale);
    const starText =
      locale === "ko"
        ? `${project.stars}개의 스타를 받은 저장소입니다.`
        : `It currently has ${project.stars} stars.`;
    const techText =
      projectTechText.length > 0
        ? locale === "ko"
          ? `기술 흐름은 ${projectTechText} 중심입니다.`
          : `Its technical throughline is centered on ${projectTechText}.`
        : "";

    return {
      name: project.name,
      narrative:
        locale === "ko"
          ? `${project.description} ${project.whyItMatters} ${project.evidence} ${starText} ${techText}`.trim()
          : `${project.description} ${project.whyItMatters} ${project.evidence} ${starText} ${techText}`.trim(),
      repoUrl: project.repoUrl,
      homepageUrl: project.homepageUrl,
    };
  });

  return {
    opening: analysis.profile.summary,
    patternReading: `${analysis.inferred.developerType} ${analysis.inferred.workingStyle}`,
    fitNarrative,
    benchmarkNarrative,
    techNarrative,
    projectReadings,
  };
}

export function composeProfileTemplateView(
  analysis: GitHubPrintAnalysis,
  benchmark: BenchmarkSnapshot,
  locale: Locale,
  dataMode: DataMode = "public",
): ProfileTemplateView {
  const coreStack = analysis.facts.coreStack.slice(0, 3);
  const strengths = analysis.inferred.strengths.slice(0, 2);
  const roles = analysis.inferred.bestFitRoles.slice(0, 2);
  const stackText = joinReadable(coreStack, locale);
  const strengthText = joinReadable(strengths, locale);
  const roleText = joinReadable(roles, locale);

  return {
    summary: firstSentences(analysis.profile.summary, 3),
    projectLead:
      locale === "ko"
        ? "대표 프로젝트는 이 프로필의 기술 선택과 작업 방식이 가장 또렷하게 드러나는 저장소들입니다."
        : "These repositories are the clearest examples of the profile's technical choices and working habits.",
    techNarrative:
      locale === "ko"
        ? `${stackText} 중심의 기술 흐름이 반복되며, 대표 프로젝트에서도 이 조합이 꾸준히 나타납니다.`
        : `A recurring technical throughline runs through ${stackText}, and the same stack choices appear repeatedly in the standout work.`,
    benchmarkNarrative:
      locale === "ko"
        ? `${benchmark.cohortLabel} 기준으로 보면 ${benchmark.insight}`
        : `Against the ${benchmark.cohortLabel}, ${benchmark.insight}`,
    strengthsLead:
      locale === "ko"
        ? `대표 강점은 ${strengthText} 쪽에 가깝습니다.`
        : `The clearest strengths cluster around ${strengthText}.`,
    roleLead:
      locale === "ko"
        ? dataMode === "private_enriched"
          ? `승인된 GitHub 기준으로는 ${roleText} 같은 역할과의 접점이 비교적 분명합니다.`
          : `공개 정보 기준으로는 ${roleText} 같은 역할과의 접점이 비교적 분명합니다.`
        : dataMode === "private_enriched"
          ? `Based on authorized GitHub evidence, the profile aligns most naturally with roles such as ${roleText}.`
          : `Based on public evidence, the profile aligns most naturally with roles such as ${roleText}.`,
  };
}
