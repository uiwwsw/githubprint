import type { AnalysisResult } from "@/lib/analyze";
import {
  type AuthorizedPrivateInsights,
  type ContributionSummary,
  type DataMode,
  type Locale,
  type PrivateExposureMode,
  type TemplateId,
} from "@/lib/schemas";
import { BriefTemplate } from "@/components/templates/brief";
import { ProfileTemplate } from "@/components/templates/profile";
import { InsightTemplate } from "@/components/templates/insight";

type TemplateProps = {
  analysisResult: AnalysisResult;
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  contributionSummary?: ContributionSummary | null;
  dataMode: DataMode;
  generatedAt: string;
  locale: Locale;
  privateExposureMode?: PrivateExposureMode;
  profileUrl: string;
};

export function RenderTemplate({
  template,
  analysisResult,
  authorizedPrivateInsights,
  contributionSummary,
  dataMode,
  generatedAt,
  locale,
  privateExposureMode = "aggregate",
  profileUrl,
}: TemplateProps & {
  template: TemplateId;
}) {
  const templateNode =
    template === "brief" ? (
      <BriefTemplate
        analysis={analysisResult.analysis}
        authorizedPrivateInsights={authorizedPrivateInsights}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        privateExposureMode={privateExposureMode}
        profileUrl={profileUrl}
      />
    ) : template === "insight" ? (
      <InsightTemplate
        analysis={analysisResult.analysis}
        authorizedPrivateInsights={authorizedPrivateInsights}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        privateExposureMode={privateExposureMode}
        profileUrl={profileUrl}
      />
    ) : (
      <ProfileTemplate
        analysis={analysisResult.analysis}
        authorizedPrivateInsights={authorizedPrivateInsights}
        benchmark={analysisResult.benchmark}
        contributionSummary={contributionSummary}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        dataMode={dataMode}
        privateExposureMode={privateExposureMode}
        profileUrl={profileUrl}
      />
    );

  return <section id="result-preview">{templateNode}</section>;
}
