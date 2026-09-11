import { getDictionary } from "@/lib/i18n";
import {
  DocumentFooter,
  DocumentIdentity,
  EditorialList,
  FactGrid,
  ProjectList,
  PublicDataScope,
  SectionBlock,
  BenchmarkSnapshotBlock,
} from "@/components/result/common";
import {
  DocumentShell,
  DocumentMasthead,
} from "@/components/result/document-shell";
import { composeInsightTemplateView } from "@/lib/template-composers";
import type {
  AuthorizedPrivateInsights,
  BenchmarkSnapshot,
  ContributionSummary,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
  PrivateExposureMode,
} from "@/lib/schemas";
export function InsightTemplate({
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
  const view = composeInsightTemplateView(analysis, benchmark, locale);
  return (
    <DocumentShell
      template="insight"
      accent={
        <DocumentMasthead
          template="Insight / Work report"
          generatedAt={generatedAt}
          locale={locale}
        />
      }
    >
      <DocumentIdentity
        analysis={analysis}
        profileUrl={profileUrl}
        summary={view.opening}
      />
      <FactGrid
        analysis={analysis}
        authorizedPrivateInsights={authorizedPrivateInsights}
        dataMode={dataMode}
        locale={locale}
      />
      <SectionBlock
        title={dict.templates.insight.sections.workingStyle}
        eyebrow="01 / OBSERVATIONS"
      >
        <p>{view.patternReading}</p>
        <EditorialList items={analysis.inferred.strengths.slice(0, 3)} />
      </SectionBlock>
      <SectionBlock
        title={dict.templates.insight.sections.benchmark}
        eyebrow="02 / CONTEXT"
      >
        <BenchmarkSnapshotBlock
          benchmark={benchmark}
          locale={locale}
          showInsight={false}
        />
      </SectionBlock>
      <SectionBlock
        title={dict.templates.insight.sections.projectReading}
        eyebrow="03 / PROJECTS"
      >
        <ProjectList analysis={analysis} locale={locale} />
      </SectionBlock>
      <SectionBlock
        title={dict.templates.insight.sections.fit}
        eyebrow="04 / POSSIBILITIES"
      >
        <p>{view.fitNarrative}</p>
        <EditorialList items={analysis.inferred.bestFitRoles.slice(0, 3)} />
        <p className="mt-3 text-sm text-neutral-500">
          {analysis.inferred.cautionNote}
        </p>
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
