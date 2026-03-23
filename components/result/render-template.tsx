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
import { ResumeTemplate } from "@/components/templates/resume";
import type { ResumeDocumentData } from "@/lib/resume";

type SharedTemplateProps = {
  avatarUrl?: string;
  generatedAt: string;
  locale: Locale;
  profileUrl: string;
};

type AnalysisTemplateProps = SharedTemplateProps & {
  analysisResult: AnalysisResult;
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  contributionSummary?: ContributionSummary | null;
  dataMode: DataMode;
  privateExposureMode?: PrivateExposureMode;
  template: Exclude<TemplateId, "resume">;
};

type ResumeRenderProps = SharedTemplateProps & {
  resumeDocument: ResumeDocumentData;
  template: "resume";
};

export function RenderTemplate(
  props: AnalysisTemplateProps | ResumeRenderProps,
) {
  if (props.template === "resume") {
    return (
      <section id="result-preview">
        <ResumeTemplate
          avatarUrl={props.avatarUrl}
          generatedAt={props.generatedAt}
          locale={props.locale}
          profileUrl={props.profileUrl}
          resume={props.resumeDocument}
        />
      </section>
    );
  }

  const templateNode =
    props.template === "brief" ? (
      <BriefTemplate
        analysis={props.analysisResult.analysis}
        authorizedPrivateInsights={props.authorizedPrivateInsights}
        benchmark={props.analysisResult.benchmark}
        contributionSummary={props.contributionSummary}
        generatedAt={props.generatedAt}
        locale={props.locale}
        mode={props.analysisResult.mode}
        dataMode={props.dataMode}
        privateExposureMode={props.privateExposureMode}
        profileUrl={props.profileUrl}
      />
    ) : props.template === "insight" ? (
      <InsightTemplate
        analysis={props.analysisResult.analysis}
        authorizedPrivateInsights={props.authorizedPrivateInsights}
        benchmark={props.analysisResult.benchmark}
        contributionSummary={props.contributionSummary}
        generatedAt={props.generatedAt}
        locale={props.locale}
        mode={props.analysisResult.mode}
        dataMode={props.dataMode}
        privateExposureMode={props.privateExposureMode}
        profileUrl={props.profileUrl}
      />
    ) : (
      <ProfileTemplate
        analysis={props.analysisResult.analysis}
        authorizedPrivateInsights={props.authorizedPrivateInsights}
        benchmark={props.analysisResult.benchmark}
        contributionSummary={props.contributionSummary}
        generatedAt={props.generatedAt}
        locale={props.locale}
        mode={props.analysisResult.mode}
        dataMode={props.dataMode}
        privateExposureMode={props.privateExposureMode}
        profileUrl={props.profileUrl}
      />
    );

  return <section id="result-preview">{templateNode}</section>;
}
