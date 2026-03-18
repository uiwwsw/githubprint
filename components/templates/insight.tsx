import { getDictionary } from "@/lib/i18n";
import { ChipList, DocumentFooter, EvidenceList, FactGrid, ProjectList, SectionBlock } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { formatDate } from "@/lib/utils";
import { type GitFolioAnalysis, type Locale } from "@/lib/schemas";

export function InsightTemplate({
  analysis,
  generatedAt,
  mode,
  profileUrl,
  locale,
}: {
  analysis: GitFolioAnalysis;
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
          <MetaRibbon label={dict.templates.insight.ribbonTemplate} value="Insight" />
          <MetaRibbon label={dict.templates.insight.ribbonGenerated} value={formatDate(generatedAt, locale)} />
          <MetaRibbon label={dict.templates.insight.ribbonProfile} value={`@${analysis.profile.username}`} />
          <MetaRibbon
            label={dict.templates.insight.ribbonMode}
            value={mode === "openai" ? dict.templates.insight.ribbonOpenAi : dict.templates.insight.ribbonFallback}
          />
        </div>
      }
    >
      <header className="rounded-[1.9rem] border border-black/[0.08] bg-black/[0.03] p-7">
        <div className="flex flex-col gap-6">
          <div className="min-w-0 max-w-none">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">{dict.templates.insight.eyebrow}</p>
            <h1 className="mt-3 font-serif text-[clamp(2.9rem,6.8vw,4.3rem)] leading-[1.04] text-neutral-950">
              {analysis.profile.headline}
            </h1>
            <p className="mt-5 text-[17px] leading-8 text-neutral-700">{analysis.profile.summary}</p>
          </div>
          <div className="w-full border-t border-black/10 pt-5 text-sm leading-7 text-neutral-600">
            <p className="font-medium text-neutral-900">{analysis.profile.name}</p>
            <p>@{analysis.profile.username}</p>
            <a className="mt-2 inline-block max-w-full break-all underline decoration-black/20 underline-offset-4" href={profileUrl} rel="noreferrer" target="_blank">
              {profileUrl}
            </a>
          </div>
        </div>
        <div className="mt-7">
          <FactGrid analysis={analysis} locale={locale} />
        </div>
      </header>

      <div className="mt-8 space-y-6">
        <div className="document-grid-insight-top">
          <SectionBlock className="bg-white" title={dict.templates.insight.sections.type} eyebrow={dict.templates.insight.sections.type}>
            <p>{analysis.inferred.developerType}</p>
          </SectionBlock>
          <SectionBlock className="bg-white" title={dict.templates.insight.sections.workingStyle} eyebrow={dict.templates.insight.sections.workingStyle}>
            <p>{analysis.inferred.workingStyle}</p>
          </SectionBlock>
        </div>

        <div className="document-grid-insight-middle">
          <SectionBlock title={dict.templates.insight.sections.fit} eyebrow={dict.templates.insight.sections.fit}>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-900">{dict.templates.insight.sections.strengths}</p>
                <ChipList items={analysis.inferred.strengths} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-900">{dict.templates.insight.sections.roles}</p>
                <ChipList items={analysis.inferred.bestFitRoles} />
              </div>
              <p className="text-sm leading-7 text-neutral-500">{analysis.inferred.cautionNote}</p>
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.projectReading} eyebrow={dict.templates.insight.sections.projectReading}>
            <ProjectList analysis={analysis} locale={locale} variant="narrative" />
          </SectionBlock>
        </div>

        <div className="document-grid-insight-bottom">
          <SectionBlock title={dict.templates.insight.sections.evidence} eyebrow={dict.templates.insight.sections.evidence}>
            <EvidenceList analysis={analysis} />
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.tech} eyebrow={dict.templates.insight.sections.tech}>
            <div className="space-y-4">
              <ChipList items={analysis.facts.topLanguages} />
              <p className="text-sm leading-7 text-neutral-600">{analysis.facts.activityNote}</p>
            </div>
          </SectionBlock>
        </div>
      </div>

      <DocumentFooter disclaimer={analysis.disclaimer} />
    </DocumentShell>
  );
}
