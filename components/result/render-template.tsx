import type { AnalysisResult } from "@/lib/analyze";
import { type Locale, type TemplateId } from "@/lib/schemas";
import { BriefTemplate } from "@/components/templates/brief";
import { ProfileTemplate } from "@/components/templates/profile";
import { InsightTemplate } from "@/components/templates/insight";

type TemplateProps = {
  analysisResult: AnalysisResult;
  generatedAt: string;
  locale: Locale;
  profileUrl: string;
};

export function RenderTemplate({
  template,
  analysisResult,
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
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        profileUrl={profileUrl}
      />
    ) : template === "insight" ? (
      <InsightTemplate
        analysis={analysisResult.analysis}
        benchmark={analysisResult.benchmark}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        profileUrl={profileUrl}
      />
    ) : (
      <ProfileTemplate
        analysis={analysisResult.analysis}
        benchmark={analysisResult.benchmark}
        generatedAt={generatedAt}
        locale={locale}
        mode={analysisResult.mode}
        profileUrl={profileUrl}
      />
    );

  return <section id="result-preview">{templateNode}</section>;
}
