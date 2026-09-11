import type {
  BenchmarkSnapshot,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
} from "@/lib/schemas";

/** Sentence boundaries must not split technology names (Next.js) or versions (3.12). */
function firstSentences(text: string, count: number) {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

export function composeBriefTemplateView(
  analysis: GitHubPrintAnalysis,
  _benchmark: BenchmarkSnapshot,
  _locale: Locale,
  _dataMode: DataMode = "public",
) {
  return {
    summary: firstSentences(analysis.profile.summary, 2),
    highlights: analysis.inferred.strengths.slice(0, 3),
    activityNote: analysis.facts.activityNote,
  };
}

export function composeProfileTemplateView(
  analysis: GitHubPrintAnalysis,
  _benchmark: BenchmarkSnapshot,
  _locale: Locale,
  _dataMode: DataMode = "public",
) {
  return { summary: firstSentences(analysis.profile.summary, 3) };
}

export function composeInsightTemplateView(
  analysis: GitHubPrintAnalysis,
  _benchmark: BenchmarkSnapshot,
  locale: Locale,
) {
  return {
    opening: analysis.profile.summary,
    patternReading: [
      ...new Set([
        analysis.inferred.developerType,
        analysis.inferred.workingStyle,
      ]),
    ].join(" "),
    fitNarrative:
      locale === "ko"
        ? "아래 분야는 확인된 프로젝트와 기술을 바탕으로 더 살펴볼 수 있는 방향입니다. 채용 적합성이나 실제 담당 업무를 뜻하지는 않습니다."
        : "These areas are worth exploring based on the projects and technologies above. They are not assessments of hiring fit or verified responsibilities.",
  };
}
