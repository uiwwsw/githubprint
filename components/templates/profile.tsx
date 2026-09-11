import { getDictionary } from "@/lib/i18n";
import {
  DocumentFooter,
  DocumentIdentity,
  EditorialList,
  ProjectList,
  PublicDataScope,
  SectionBlock,
  ChipList,
} from "@/components/result/common";
import {
  DocumentShell,
  DocumentMasthead,
} from "@/components/result/document-shell";
import { composeProfileTemplateView } from "@/lib/template-composers";
import type {
  AuthorizedPrivateInsights,
  BenchmarkSnapshot,
  ContributionSummary,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
  PrivateExposureMode,
} from "@/lib/schemas";
export function ProfileTemplate({
  analysis,
  authorizedPrivateInsights,
  benchmark,
  contributionSummary,
  dataMode,
  generatedAt,
  privateExposureMode = "aggregate",
  profileUrl,
  locale,
}: {
  analysis: GitHubPrintAnalysis;
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  benchmark: BenchmarkSnapshot;
  contributionSummary?: ContributionSummary | null;
  dataMode: DataMode;
  generatedAt: string;
  mode: "openai" | "fallback";
  privateExposureMode?: PrivateExposureMode;
  profileUrl: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const view = composeProfileTemplateView(
    analysis,
    benchmark,
    locale,
    dataMode,
  );
  return (
    <DocumentShell
      template="profile"
      accent={
        <DocumentMasthead
          template="Profile / Portfolio"
          generatedAt={generatedAt}
          locale={locale}
        />
      }
    >
      <DocumentIdentity
        locale={locale}
        analysis={analysis}
        profileUrl={profileUrl}
        summary={view.summary}
      />
      <SectionBlock
        title={dict.templates.profile.sections.projects}
        eyebrow="SELECTED PROJECTS"
      >
        <ProjectList analysis={analysis} locale={locale} variant="narrative" />
      </SectionBlock>
      <div className="profile-overview">
        <SectionBlock title={dict.templates.profile.sections.tech}>
          <ChipList items={analysis.facts.coreStack} />
        </SectionBlock>
        <SectionBlock title={dict.templates.profile.sections.strengths}>
          <EditorialList items={analysis.inferred.strengths} />
        </SectionBlock>
      </div>
      <SectionBlock
        title={dict.templates.profile.sections.workingStyle}
        eyebrow="IN PRACTICE"
      >
        <p>{analysis.inferred.workingStyle}</p>
        <p className="mt-3">{analysis.facts.activityNote}</p>
      </SectionBlock>
      <PublicDataScope
        compact
        authorizedPrivateInsights={authorizedPrivateInsights}
        contributionSummary={contributionSummary}
        dataMode={dataMode}
        locale={locale}
        privateExposureMode={privateExposureMode}
      />
      <DocumentFooter disclaimer={analysis.disclaimer} />
    </DocumentShell>
  );
}
