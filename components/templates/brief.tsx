import { getDictionary } from "@/lib/i18n";
import { BenchmarkSnapshotBlock, DocumentFooter, EvidenceList, FactGrid, ProjectList, PublicDataScope, SectionBlock, ChipList } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { formatDate } from "@/lib/utils";
import { type BenchmarkSnapshot, type GitFolioAnalysis, type Locale } from "@/lib/schemas";

export function BriefTemplate({
  analysis,
  benchmark,
  generatedAt,
  mode,
  profileUrl,
  locale,
}: {
  analysis: GitFolioAnalysis;
  benchmark: BenchmarkSnapshot;
  generatedAt: string;
  mode: "openai" | "fallback";
  profileUrl: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <DocumentShell
      accent={
        <div className="flex flex-wrap gap-2">
          <MetaRibbon label={dict.templates.brief.ribbonTemplate} value="Brief" />
          <MetaRibbon label={dict.templates.brief.ribbonGenerated} value={formatDate(generatedAt, locale)} />
          <MetaRibbon
            label={dict.templates.brief.ribbonSource}
            value={mode === "openai" ? dict.templates.brief.ribbonOpenAi : dict.templates.brief.ribbonFallback}
          />
        </div>
      }
    >
      <div className="document-grid-brief gap-8">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-5">
            <img
              alt={analysis.profile.name}
              className="h-20 w-20 shrink-0 rounded-[1.6rem] object-cover"
              src={analysis.profile.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">{dict.templates.brief.eyebrow}</p>
              <h1 className="mt-2 break-words font-serif text-[clamp(2.2rem,5vw,3.3rem)] leading-tight text-neutral-950">
                {analysis.profile.name}
              </h1>
              <p className="mt-2 truncate text-sm text-neutral-500">@{analysis.profile.username}</p>
              <p className="mt-4 text-lg leading-8 text-neutral-800">{analysis.profile.headline}</p>
            </div>
          </div>

          <div className="mt-7">
            <FactGrid analysis={analysis} locale={locale} />
          </div>

          <div className="mt-7 space-y-6">
            <SectionBlock title={dict.templates.brief.sections.summary} eyebrow={dict.templates.brief.sections.summary}>
              <p>{analysis.profile.summary}</p>
            </SectionBlock>
            <SectionBlock title={dict.templates.brief.sections.strengths} eyebrow={dict.templates.brief.sections.strengths}>
              <ChipList items={analysis.inferred.strengths} />
            </SectionBlock>
            <SectionBlock title={dict.templates.brief.sections.projects} eyebrow={dict.templates.brief.sections.projects}>
              <ProjectList analysis={analysis} locale={locale} variant="compact" />
            </SectionBlock>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.brief.sections.type} eyebrow={dict.templates.brief.sections.type}>
            <p>{analysis.inferred.developerType}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.workingStyle} eyebrow={dict.templates.brief.sections.workingStyle}>
            <p>{analysis.inferred.workingStyle}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.benchmark} eyebrow={dict.templates.brief.sections.benchmark}>
            <BenchmarkSnapshotBlock benchmark={benchmark} locale={locale} />
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.bestFit} eyebrow={dict.templates.brief.sections.bestFit}>
            <ChipList items={analysis.inferred.bestFitRoles} />
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.evidence} eyebrow={dict.templates.brief.sections.evidence}>
            <EvidenceList analysis={analysis} />
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.dataScope} eyebrow={dict.templates.brief.sections.dataScope}>
            <PublicDataScope locale={locale} />
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.source} eyebrow={dict.templates.brief.sections.source}>
            <a className="break-all underline decoration-black/20 underline-offset-4" href={profileUrl} rel="noreferrer" target="_blank">
              {profileUrl}
            </a>
          </SectionBlock>
        </div>
      </div>
      <DocumentFooter disclaimer={analysis.disclaimer} />
    </DocumentShell>
  );
}
