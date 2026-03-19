import {
  formatBenchmarkRankLabel,
  getBenchmarkInterpretationNote,
} from "@/lib/benchmark-presentation";
import { getDictionary } from "@/lib/i18n";
import { DocumentFooter, FactGrid, ProjectList, PublicDataScope, SectionBlock } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { formatDate } from "@/lib/utils";
import { composeBriefTemplateView } from "@/lib/template-composers";
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
  const view = composeBriefTemplateView(analysis, benchmark, locale);

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
              <p className="mt-4 text-lg leading-8 text-neutral-800">{view.headline}</p>
            </div>
          </div>

          <div className="mt-7">
            <FactGrid analysis={analysis} locale={locale} />
          </div>

          <div className="mt-7 space-y-6">
            <SectionBlock title={dict.templates.brief.sections.summary} eyebrow={dict.templates.brief.sections.summary}>
              <p>{view.summary}</p>
            </SectionBlock>
            <SectionBlock title={dict.templates.brief.sections.strengths} eyebrow={dict.templates.brief.sections.strengths}>
              <BriefSignalList items={view.highlights} />
            </SectionBlock>
            <SectionBlock title={dict.templates.brief.sections.projects} eyebrow={dict.templates.brief.sections.projects}>
              <ProjectList analysis={analysis} locale={locale} variant="compact" />
            </SectionBlock>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <SectionBlock title={dict.templates.brief.sections.activity} eyebrow={dict.templates.brief.sections.activity}>
            <p>{view.activityNote}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.brief.sections.benchmark} eyebrow={dict.templates.brief.sections.benchmark}>
            <BriefBenchmarkSnapshot benchmark={benchmark} topMetrics={view.topMetrics} locale={locale} />
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

function BriefSignalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] px-4 py-3 text-sm leading-6 text-neutral-700" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function BriefBenchmarkSnapshot({
  benchmark,
  topMetrics,
  locale,
}: {
  benchmark: BenchmarkSnapshot;
  topMetrics: BenchmarkSnapshot["metrics"];
  locale: Locale;
}) {
  const interpretationNote = getBenchmarkInterpretationNote({
    confidenceScore: benchmark.confidenceScore,
    sampleSize: benchmark.sampleSize,
    locale,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-neutral-600">{benchmark.insight}</p>
      {interpretationNote ? (
        <p className="text-sm leading-6 text-neutral-500">{interpretationNote}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {topMetrics.map((metric) => (
          <div className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4" key={metric.id}>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">{metric.label}</p>
            <p className="mt-2 text-base font-medium text-neutral-900">
              {formatBenchmarkRankLabel({
                percentile: metric.percentile,
                confidenceScore: benchmark.confidenceScore,
                sampleSize: benchmark.sampleSize,
                locale,
              })}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{metric.note}</p>
            {metric.evidence.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-neutral-500">
                {metric.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
