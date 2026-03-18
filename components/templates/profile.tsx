import { getDictionary } from "@/lib/i18n";
import { ChipList, DocumentFooter, EvidenceList, FactGrid, ProjectList, SectionBlock } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { formatDate } from "@/lib/utils";
import { type GitFolioAnalysis, type Locale } from "@/lib/schemas";

export function ProfileTemplate({
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
            <p className="mt-5 text-[17px] leading-8 text-neutral-700">{analysis.profile.summary}</p>
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
          <FactGrid analysis={analysis} locale={locale} />
        </div>
      </header>

      <div className="document-grid-profile mt-8">
        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.profile.sections.type} eyebrow={dict.templates.profile.sections.type}>
            <p>{analysis.inferred.developerType}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.workingStyle} eyebrow={dict.templates.profile.sections.workingStyle}>
            <p>{analysis.inferred.workingStyle}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.projects} eyebrow={dict.templates.profile.sections.projects}>
            <ProjectList analysis={analysis} locale={locale} />
          </SectionBlock>
        </div>
        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.profile.sections.tech} eyebrow={dict.templates.profile.sections.tech}>
            <ChipList items={analysis.facts.topLanguages} />
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.strengths} eyebrow={dict.templates.profile.sections.strengths}>
            <ChipList items={analysis.inferred.strengths} />
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.bestFit} eyebrow={dict.templates.profile.sections.bestFit}>
            <ChipList items={analysis.inferred.bestFitRoles} />
          </SectionBlock>
          <SectionBlock title={dict.templates.profile.sections.evidence} eyebrow={dict.templates.profile.sections.evidence}>
            <EvidenceList analysis={analysis} />
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
