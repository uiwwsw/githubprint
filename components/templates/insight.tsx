import {
  formatBenchmarkRankLabel,
  getBenchmarkInterpretationNote,
} from "@/lib/benchmark-presentation";
import { getDictionary } from "@/lib/i18n";
import { ChipList, DocumentFooter, EvidenceList, FactGrid, PublicDataScope, SectionBlock } from "@/components/result/common";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { formatDate } from "@/lib/utils";
import { composeInsightTemplateView } from "@/lib/template-composers";
import {
  type AuthorizedPrivateInsights,
  type BenchmarkSnapshot,
  type ContributionSummary,
  type DataMode,
  type GitHubPrintAnalysis,
  type Locale,
  type PrivateExposureMode,
} from "@/lib/schemas";

export function InsightTemplate({
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
  const view = composeInsightTemplateView(analysis, benchmark, locale);

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
          <FactGrid
            analysis={analysis}
            authorizedPrivateInsights={authorizedPrivateInsights}
            dataMode={dataMode}
            locale={locale}
          />
        </div>
      </header>

      <div className="document-grid-stack document-grid-stack-insight mt-8">
        <div className="min-w-0 space-y-6">
          <SectionBlock className="bg-white" title={dict.templates.insight.sections.type} eyebrow={dict.templates.insight.sections.type}>
            <div className="space-y-4">
              <p>{view.opening}</p>
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.fit} eyebrow={dict.templates.insight.sections.fit}>
            <div className="space-y-4">
              <p>{view.fitNarrative}</p>
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-900">{dict.templates.insight.sections.strengths}</p>
                <ChipList items={analysis.inferred.strengths} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-900">{dict.templates.insight.sections.roles}</p>
                <ChipList items={analysis.inferred.bestFitRoles} />
              </div>
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.benchmark} eyebrow={dict.templates.insight.sections.benchmark}>
            <InsightBenchmarkReading benchmark={benchmark} narrative={view.benchmarkNarrative} locale={locale} />
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.evidence} eyebrow={dict.templates.insight.sections.evidence}>
            <EvidenceList analysis={analysis} />
          </SectionBlock>
        </div>

        <div className="min-w-0 space-y-6">
          <SectionBlock className="bg-white" title={dict.templates.insight.sections.workingStyle} eyebrow={dict.templates.insight.sections.workingStyle}>
            <p>{view.patternReading}</p>
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.projectReading} eyebrow={dict.templates.insight.sections.projectReading}>
            <InsightProjectReadings readings={view.projectReadings} locale={locale} />
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.tech} eyebrow={dict.templates.insight.sections.tech}>
            <div className="space-y-4">
              <p>{view.techNarrative}</p>
              <ChipList items={analysis.facts.coreStack} />
            </div>
          </SectionBlock>
          <SectionBlock title={dict.templates.insight.sections.dataScope} eyebrow={dict.templates.insight.sections.dataScope}>
            <PublicDataScope
              authorizedPrivateInsights={authorizedPrivateInsights}
              contributionSummary={contributionSummary}
              dataMode={dataMode}
              locale={locale}
              privateExposureMode={privateExposureMode}
            />
          </SectionBlock>
        </div>
      </div>

      <DocumentFooter disclaimer={analysis.disclaimer} />
    </DocumentShell>
  );
}

function InsightProjectReadings({
  readings,
  locale,
}: {
  readings: ReturnType<typeof composeInsightTemplateView>["projectReadings"];
  locale: Locale;
}) {
  return (
    <div className="space-y-6">
      {readings.map((project) => (
        <article className="border-b border-black/[0.08] pb-6 last:border-b-0 last:pb-0" key={project.repoUrl}>
          <h3 className="font-serif text-[1.45rem] leading-tight text-neutral-950">{project.name}</h3>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">{project.narrative}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
            <a className="break-all underline decoration-black/20 underline-offset-4" href={project.repoUrl} rel="noreferrer" target="_blank">
              {locale === "ko" ? "저장소 링크" : "GitHub repo"}
            </a>
            {project.homepageUrl ? (
              <a className="break-all underline decoration-black/20 underline-offset-4" href={project.homepageUrl} rel="noreferrer" target="_blank">
                {locale === "ko" ? "서비스 링크" : "Live link"}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function InsightBenchmarkReading({
  benchmark,
  narrative,
  locale,
}: {
  benchmark: BenchmarkSnapshot;
  narrative: string;
  locale: Locale;
}) {
  const interpretationNote = getBenchmarkInterpretationNote({
    confidenceScore: benchmark.confidenceScore,
    sampleSize: benchmark.sampleSize,
    locale,
  });
  const topMetrics = [...benchmark.metrics]
    .sort((left, right) => right.percentile - left.percentile)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <p>{narrative}</p>
      {interpretationNote ? (
        <p className="text-sm leading-6 text-neutral-500">{interpretationNote}</p>
      ) : null}
      <div className="space-y-3">
        {topMetrics.map((metric) => (
          <div className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4" key={metric.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">{metric.label}</p>
              <span className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {formatBenchmarkRankLabel({
                  percentile: metric.percentile,
                  confidenceScore: benchmark.confidenceScore,
                  sampleSize: benchmark.sampleSize,
                  locale,
                })}
              </span>
            </div>
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
