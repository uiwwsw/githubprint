import type { ReactNode } from "react";
import { getDictionary } from "@/lib/i18n";
import type { BenchmarkSnapshot, Locale } from "@/lib/schemas";
import { formatDate, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type GitFolioAnalysis } from "@/lib/schemas";

export function SectionBlock({
  title,
  eyebrow,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("print-break-inside-avoid rounded-[1.4rem] border border-black/[0.08] bg-white/70 p-6", className)}>
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-serif text-[1.4rem] leading-tight text-neutral-950">{title}</h2>
      <div className="mt-4 text-[15px] leading-7 text-neutral-700">{children}</div>
    </section>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          className="rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-700"
          key={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function FactGrid({
  analysis,
  locale,
}: {
  analysis: GitFolioAnalysis;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FactCard label={dict.common.factTech} value={analysis.facts.topLanguages.slice(0, 3).join(", ")} />
      <FactCard
        label={dict.common.factRepos}
        value={`${formatNumber(analysis.facts.publicRepoCount, locale)}${dict.common.repoUnit}`}
      />
      <FactCard
        label={dict.common.factFollowers}
        value={`${formatNumber(analysis.facts.followers, locale)}${dict.common.followerUnit}`}
      />
    </div>
  );
}

export function BenchmarkSnapshotBlock({
  benchmark,
  locale,
}: {
  benchmark: BenchmarkSnapshot;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FactCard
          label={dict.common.benchmarkOverall}
          value={
            locale === "ko"
              ? `상위 ${benchmark.overallPercentile}%`
              : `Top ${benchmark.overallPercentile}%`
          }
        />
        <FactCard
          label={dict.common.confidenceLabel}
          value={`${benchmark.confidenceScore}/100`}
        />
        <FactCard label={dict.common.cohortLabel} value={benchmark.cohortLabel} />
        <FactCard
          label={dict.common.sampleSizeLabel}
          value={formatNumber(benchmark.sampleSize, locale)}
        />
      </div>
      <p className="text-sm leading-7 text-neutral-600">{benchmark.insight}</p>
      <div className="space-y-3">
        {benchmark.metrics.map((metric) => (
          <div
            className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
            key={metric.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">{metric.label}</p>
              <span className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {locale === "ko"
                  ? `상위 ${metric.percentile}%`
                  : `Top ${metric.percentile}%`}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{metric.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicDataScope({
  locale,
}: {
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const items = dict.home.dataScopeItems;

  return (
    <div className="space-y-3">
      {[items.profile, items.repositories, items.limits].map((item) => (
        <div
          className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
          key={item}
        >
          <p className="text-sm leading-6 text-neutral-600">{item}</p>
        </div>
      ))}
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-black/[0.07] bg-black/[0.025] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">{label}</p>
      <p className="mt-3 break-words text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export function ProjectList({
  analysis,
  locale,
  variant = "default",
}: {
  analysis: GitFolioAnalysis;
  locale: Locale;
  variant?: "default" | "compact" | "narrative";
}) {
  const dict = getDictionary(locale);
  const cardClass =
    variant === "compact"
      ? "gap-4 rounded-[1.25rem] border border-black/[0.08] bg-black/[0.025] p-4"
      : variant === "narrative"
        ? "gap-5 rounded-[1.6rem] border border-black/[0.08] bg-white p-5 shadow-[0_16px_38px_-32px_rgba(0,0,0,0.4)]"
        : "gap-5 rounded-[1.35rem] border border-black/[0.08] bg-black/[0.02] p-5";

  return (
    <div className="space-y-4">
      {analysis.projects.length === 0 ? (
        <div className="rounded-[1.3rem] border border-dashed border-black/10 bg-black/[0.02] p-5 text-sm text-neutral-500">
          {dict.common.noProjects}
        </div>
      ) : null}
      {analysis.projects.map((project) => (
        <article className={cn("print-break-inside-avoid", cardClass)} key={project.repoUrl}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-serif text-xl text-neutral-950">{project.name}</h3>
                <span className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[11px] tracking-[0.18em] text-neutral-500 uppercase">
                  {project.stars} {dict.common.starsLabel}
                </span>
              </div>
              <p className="mt-3 break-words text-sm leading-6 text-neutral-600">{project.description}</p>
            </div>
            <div className="shrink-0 text-sm text-neutral-500">
              <p>{formatDate(project.updatedAt, locale)}</p>
            </div>
          </div>
          <div className="mt-4">
            <ChipList items={project.tech} />
          </div>
          <p className="mt-4 text-sm leading-7 text-neutral-700">{project.whyItMatters}</p>
          <p className="mt-3 text-sm leading-7 text-neutral-500">{project.evidence}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
            <a className="break-all underline decoration-black/20 underline-offset-4" href={project.repoUrl} rel="noreferrer" target="_blank">
              {dict.common.repoLink}
            </a>
            {project.homepageUrl ? (
              <a className="break-all underline decoration-black/20 underline-offset-4" href={project.homepageUrl} rel="noreferrer" target="_blank">
                {dict.common.liveLink}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function EvidenceList({ analysis }: { analysis: GitFolioAnalysis }) {
  return (
    <div className="space-y-3">
      {analysis.evidence.map((item) => (
        <div className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4" key={`${item.label}-${item.detail}`}>
          <p className="text-sm font-medium text-neutral-900">{item.label}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function DocumentFooter({
  disclaimer,
}: {
  disclaimer: string;
}) {
  return (
    <footer className="mt-8 border-t border-black/[0.08] pt-5 text-sm leading-6 text-neutral-500">
      <p>{disclaimer}</p>
    </footer>
  );
}
