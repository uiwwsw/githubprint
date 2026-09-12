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
import { composeBriefTemplateView } from "@/lib/template-composers";
import type {
  AuthorizedPrivateInsights,
  EvidenceReview,
  ContributionSummary,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
  PrivateExposureMode,
} from "@/lib/schemas";
export function BriefTemplate({
  analysis,
  authorizedPrivateInsights,
  evidenceReview,
  contributionSummary,
  dataMode,
  generatedAt,
  privateExposureMode = "aggregate",
  profileUrl,
  locale,
}: {
  analysis: GitHubPrintAnalysis;
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  evidenceReview: EvidenceReview;
  contributionSummary?: ContributionSummary | null;
  dataMode: DataMode;
  generatedAt: string;
  mode: "openai" | "fallback";
  privateExposureMode?: PrivateExposureMode;
  profileUrl: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const view = composeBriefTemplateView(
    analysis,
    evidenceReview,
    locale,
    dataMode,
  );
  return (
    <DocumentShell
      template="brief"
      accent={
        <DocumentMasthead
          template="Brief / Selected work"
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
      <div className="brief-stack">
        <ChipList items={analysis.facts.coreStack} />
      </div>
      <SectionBlock
        title={dict.templates.brief.sections.projects}
        eyebrow="SELECTED WORK"
      >
        <ProjectList
          analysis={analysis}
          locale={locale}
          variant="compact"
          limit={2}
        />
      </SectionBlock>
      <div className="brief-closing">
        <SectionBlock title={dict.templates.brief.sections.strengths}>
          <EditorialList items={view.highlights.slice(0, 3)} />
        </SectionBlock>
        <SectionBlock title={dict.templates.brief.sections.activity}>
          <p>{view.activityNote}</p>
        </SectionBlock>
      </div>
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
