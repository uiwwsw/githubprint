import { getDictionary } from "@/lib/i18n";
import { BenchmarkSnapshotBlock, ChipList, DocumentFooter, EvidenceList, FactGrid, ProjectList, PublicDataScope, SectionBlock } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { composeProfileTemplateView } from "@/lib/template-composers";
import { formatDate } from "@/lib/utils";
import {
  type AuthorizedPrivateInsights,
  type BenchmarkSnapshot,
  type ContributionSummary,
  type DataMode,
  type GitHubPrintAnalysis,
  type Locale,
  type PrivateExposureMode,
} from "@/lib/schemas";

export function ProfileTemplate({
  analysis,
  authorizedPrivateInsights,
  benchmark,
  contributionSummary,
  dataMode,
  generatedAt,
  mode,
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
  const view = composeProfileTemplateView(analysis, benchmark, locale, dataMode);

  return (
    <DocumentShell
      accent={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <MetaRibbon label={dict.templates.profile.ribbonTemplate} value="Profile" />
            <MetaRibbon label={dict.templates.profile.ribbonGenerated} value={formatDate(generatedAt, locale)} />
          </div>
          <MetaRibbon
            label={dict.templates.profile.ribbonMode}
            value={mode === "openai" ? dict.templates.profile.ribbonOpenAi : dict.templates.profile.ribbonFallback}
          />
        </div>
      }
    >
      <header className="border-b border-black/[0.08] pb-8">
        <div className="flex flex-col gap-8">
          <div className="min-w-0 max-w-none">
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">{dict.templates.profile.eyebrow}</p>
              <h1 className="mt-3 font-serif text-[clamp(2.8rem,6.5vw,4.1rem)] leading-[1.04] text-neutral-950">
                {analysis.profile.headline}
              </h1>
              <p className="mt-5 text-[17px] leading-8 text-neutral-700">{view.summary}</p>
            </div>
          <div className="w-full max-w-[27rem] self-start rounded-[1.8rem] border border-black/[0.08] bg-black/[0.025] p-5">
            <div className="flex min-w-0 items-center gap-4">
              <img
                alt={analysis.profile.name}
                className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[1.5rem] object-cover"
                src={analysis.profile.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="break-words font-serif text-[clamp(1.8rem,4vw,2.25rem)] leading-none text-neutral-950">
                  {analysis.profile.name}
                </p>
                <p className="mt-1 truncate text-sm text-neutral-500">@{analysis.profile.username}</p>
                <a className="mt-3 inline-flex max-w-full break-all text-sm underline decoration-black/20 underline-offset-4" href={profileUrl} rel="noreferrer" target="_blank">
                  {dict.common.githubProfile}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-7">
          <FactGrid
            analysis={analysis}
            authorizedPrivateInsights={authorizedPrivateInsights}
            dataMode={dataMode}
            locale={locale}
          />
        </div>
      </header>

      <div className="document-grid-stack document-grid-stack-profile mt-8">
        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.profile.sections.type} eyebrow={dict.templates.profile.sections.type}>
            <p>{analysis.inferred.developerType}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.workingStyle} eyebrow={dict.templates.profile.sections.workingStyle}>
            <div className="space-y-4">
              <p>{analysis.inferred.workingStyle}</p>
              <p className="text-sm leading-7 text-neutral-500">{analysis.facts.activityNote}</p>
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.projects} eyebrow={dict.templates.profile.sections.projects}>
            <div className="space-y-4">
              <p>{view.projectLead}</p>
              <ProjectList analysis={analysis} locale={locale} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.evidence} eyebrow={dict.templates.profile.sections.evidence}>
            <EvidenceList analysis={analysis} />
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.dataScope} eyebrow={dict.templates.profile.sections.dataScope}>
            <PublicDataScope
              authorizedPrivateInsights={authorizedPrivateInsights}
              contributionSummary={contributionSummary}
              dataMode={dataMode}
              locale={locale}
              privateExposureMode={privateExposureMode}
            />
          </SectionBlock>
        </div>
        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.profile.sections.tech} eyebrow={dict.templates.profile.sections.tech}>
            <div className="space-y-4">
              <p>{view.techNarrative}</p>
              <ChipList items={analysis.facts.coreStack} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.benchmark} eyebrow={dict.templates.profile.sections.benchmark}>
            <div className="space-y-4">
              <p>{view.benchmarkNarrative}</p>
              <BenchmarkSnapshotBlock benchmark={benchmark} locale={locale} showInsight={false} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.strengths} eyebrow={dict.templates.profile.sections.strengths}>
            <div className="space-y-4">
              <p>{view.strengthsLead}</p>
              <ChipList items={analysis.inferred.strengths} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.bestFit} eyebrow={dict.templates.profile.sections.bestFit}>
            <div className="space-y-4">
              <p>{view.roleLead}</p>
              <ChipList items={analysis.inferred.bestFitRoles} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.caution} eyebrow={dict.templates.profile.sections.caution}>
            <p>{analysis.inferred.cautionNote}</p>
          </SectionBlock>
        </div>
      </div>

      <DocumentFooter disclaimer={analysis.disclaimer} />
    </DocumentShell>
  );
}
