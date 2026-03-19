import type { AnalysisResult } from "@/lib/analyze";
import {
  type ContributionSummary,
  type DataMode,
  type Locale,
  type TemplateId,
} from "@/lib/schemas";
import { BriefTemplate } from "@/components/templates/brief";
import { ProfileTemplate } from "@/components/templates/profile";
import { InsightTemplate } from "@/components/templates/insight";

type TemplateProps = {
  analysisResult: AnalysisResult;
  contributionSummary?: ContributionSummary | null;
  dataMode: DataMode;
  generatedAt: string;
  locale: Locale;
  profileUrl: string;
};

export function RenderTemplate({
  template,
  analysisResult,
  contributionSummary,
  dataMode,
  generatedAt,
  locale,
  profileUrl,
}: TemplateProps & {
  template: TemplateId;
}) {
  const templateNode =
    template === "brief" ? (
      <BriefTemplate
        analysis={analysisResult.analysis}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        profileUrl={profileUrl}
      />
    ) : template === "insight" ? (
      <InsightTemplate
        analysis={analysisResult.analysis}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        profileUrl={profileUrl}
      />
    ) : (
      <ProfileTemplate
        analysis={analysisResult.analysis}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        profileUrl={profileUrl}
      />
    );

  return <section id="result-preview">{templateNode}</section>;
}
