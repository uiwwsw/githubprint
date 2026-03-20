import type { ReactNode } from "react";
import {
  formatBenchmarkRankLabel,
  getBenchmarkInterpretationNote,
} from "@/lib/benchmark-presentation";
import { getDictionary } from "@/lib/i18n";
import type {
  AuthorizedPrivateInsights,
  BenchmarkSnapshot,
  ContributionSummary,
  DataMode,
  GitHubPrintAnalysis,
  Locale,
  PrivateExposureMode,
} from "@/lib/schemas";
import { formatDate, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

function localizePrivateFacet(value: string, locale: Locale) {
  if (locale === "ko") {
    if (value === "frontend") return "프론트엔드";
    if (value === "backend") return "백엔드";
    if (value === "mobile") return "모바일";
    if (value === "devtools") return "개발툴";
    if (value === "docs") return "문서";
    if (value === "Automation") return "자동화";
  }

  if (value === "devtools") {
    return locale === "ko" ? "개발툴" : "developer tooling";
  }
  if (value === "docs") {
    return locale === "ko" ? "문서" : "documentation";
  }
  if (value === "Automation") {
    return locale === "ko" ? "자동화" : "automation";
  }

  return value;
}

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
  authorizedPrivateInsights,
  dataMode = "public",
  locale,
}: {
  analysis: GitHubPrintAnalysis;
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  dataMode?: DataMode;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const repoFact =
    dataMode === "private_enriched" && authorizedPrivateInsights
      ? {
          label: dict.common.factAuthorizedRepos,
          value:
            locale === "ko"
              ? `${formatNumber(authorizedPrivateInsights.authorizedRepoCount, locale)}${dict.common.repoUnit} (공개 ${formatNumber(analysis.facts.publicRepoCount, locale)}${dict.common.repoUnit} / 비공개 ${formatNumber(authorizedPrivateInsights.privateRepoCount, locale)}${dict.common.repoUnit})`
              : `${formatNumber(authorizedPrivateInsights.authorizedRepoCount, locale)} total (public ${formatNumber(analysis.facts.publicRepoCount, locale)} / private ${formatNumber(authorizedPrivateInsights.privateRepoCount, locale)})`,
        }
      : {
          label: dict.common.factRepos,
          value: `${formatNumber(analysis.facts.publicRepoCount, locale)}${dict.common.repoUnit}`,
        };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FactCard label={dict.common.factTech} value={analysis.facts.coreStack.slice(0, 3).join(", ")} />
      <FactCard label={repoFact.label} value={repoFact.value} />
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
  showInsight = true,
}: {
  benchmark: BenchmarkSnapshot;
  locale: Locale;
  showInsight?: boolean;
}) {
  const dict = getDictionary(locale);
  const interpretationNote = getBenchmarkInterpretationNote({
    confidenceScore: benchmark.confidenceScore,
    sampleSize: benchmark.sampleSize,
    locale,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FactCard
          label={dict.common.benchmarkOverall}
          value={formatBenchmarkRankLabel({
            percentile: benchmark.overallPercentile,
            confidenceScore: benchmark.confidenceScore,
            sampleSize: benchmark.sampleSize,
            locale,
          })}
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
      {showInsight ? <p className="text-sm leading-7 text-neutral-600">{benchmark.insight}</p> : null}
      {interpretationNote ? (
        <p className="text-sm leading-6 text-neutral-500">{interpretationNote}</p>
      ) : null}
      <div className="space-y-3">
        {benchmark.metrics.map((metric) => (
          <div
            className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
            key={metric.id}
          >
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

export function PublicDataScope({
  authorizedPrivateInsights,
  contributionSummary,
  locale,
  dataMode = "public",
  privateExposureMode = "aggregate",
}: {
  authorizedPrivateInsights?: AuthorizedPrivateInsights | null;
  contributionSummary?: ContributionSummary | null;
  locale: Locale;
  dataMode?: DataMode;
  privateExposureMode?: PrivateExposureMode;
}) {
  const dict = getDictionary(locale);
  const items =
    dataMode === "private_enriched"
      ? dict.home.signedInDataScopeItems
      : dict.home.dataScopeItems;

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
      {dataMode === "private_enriched" && contributionSummary ? (
        <SignedInActivitySnapshot
          contributionSummary={contributionSummary}
          locale={locale}
        />
      ) : null}
      {dataMode === "private_enriched" && authorizedPrivateInsights ? (
        <AuthorizedPrivateInsightsCard
          authorizedPrivateInsights={authorizedPrivateInsights}
          locale={locale}
          privateExposureMode={privateExposureMode}
        />
      ) : null}
    </div>
  );
}

function SignedInActivitySnapshot({
  contributionSummary,
  locale,
}: {
  contributionSummary: ContributionSummary;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
            {dict.common.signedInActivityTitle}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {dict.common.signedInActivityHint}
          </p>
        </div>
        <p className="text-xs leading-5 text-neutral-500">
          {dict.common.signedInActivityWindow}:{" "}
          {formatDate(contributionSummary.startedAt, locale)} -{" "}
          {formatDate(contributionSummary.endedAt, locale)}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FactCard
          label={dict.common.factContributionsYear}
          value={formatNumber(contributionSummary.totalContributions, locale)}
        />
        <FactCard
          label={dict.common.factCommitsYear}
          value={formatNumber(
            contributionSummary.totalCommitContributions,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factPullRequestsYear}
          value={formatNumber(
            contributionSummary.totalPullRequestContributions,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factIssuesYear}
          value={formatNumber(
            contributionSummary.totalIssueContributions,
            locale,
          )}
        />
      </div>
    </div>
  );
}

function AuthorizedPrivateInsightsCard({
  authorizedPrivateInsights,
  locale,
  privateExposureMode,
}: {
  authorizedPrivateInsights: AuthorizedPrivateInsights;
  locale: Locale;
  privateExposureMode: PrivateExposureMode;
}) {
  const dict = getDictionary(locale);
  const visibilityNote =
    privateExposureMode === "include"
      ? locale === "ko"
        ? "현재 결과에는 승인된 비공개 저장소의 이름과 설명이 직접 포함될 수 있습니다."
        : "This result may directly include names and descriptions from authorized private repositories."
      : authorizedPrivateInsights.hiddenRepresentativeCount > 0
        ? locale === "ko"
          ? `상위 후보였던 비공개 저장소 ${formatNumber(authorizedPrivateInsights.hiddenRepresentativeCount, locale)}개는 분석에 반영되지만, 기본 공유 모드에서는 이름과 링크를 숨깁니다.`
          : `${formatNumber(authorizedPrivateInsights.hiddenRepresentativeCount, locale)} private repositories were strong enough to be representative candidates, but their names and links stay hidden in the default sharing mode.`
        : locale === "ko"
          ? "비공개 저장소 신호는 집계형으로만 반영되고, 이름과 링크는 결과에 노출되지 않습니다."
          : "Private-repository signals are reflected only in aggregate, while names and links stay hidden in the result.";

  return (
    <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
        {dict.common.privateInsightsTitle}
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        {dict.common.privateInsightsHint}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <FactCard
          label={dict.common.factAuthorizedRepos}
          value={formatNumber(authorizedPrivateInsights.authorizedRepoCount, locale)}
        />
        <FactCard
          label={dict.common.factPrivateRepos}
          value={formatNumber(authorizedPrivateInsights.privateRepoCount, locale)}
        />
        <FactCard
          label={dict.common.factRecentPrivateRepos}
          value={formatNumber(
            authorizedPrivateInsights.recentPrivateRepoCount,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factDocumentedPrivateRepos}
          value={formatNumber(
            authorizedPrivateInsights.documentedPrivateRepoCount,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factVerifiedPrivateRepos}
          value={formatNumber(
            authorizedPrivateInsights.verifiedPrivateRepoCount,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factAutomatedPrivateRepos}
          value={formatNumber(
            authorizedPrivateInsights.automatedPrivateRepoCount,
            locale,
          )}
        />
      </div>
      {authorizedPrivateInsights.topPrivateStack.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            {dict.common.privateInsightsTopStack}
          </p>
          <ChipList items={authorizedPrivateInsights.topPrivateStack} />
        </div>
      ) : null}
      {authorizedPrivateInsights.privateOnlyStack.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            {dict.common.privateInsightsAdditionalStack}
          </p>
          <ChipList items={authorizedPrivateInsights.privateOnlyStack} />
        </div>
      ) : null}
      {authorizedPrivateInsights.topPrivateSurfaces.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            {dict.common.privateInsightsTopSurfaces}
          </p>
          <ChipList
            items={authorizedPrivateInsights.topPrivateSurfaces.map((item) =>
              localizePrivateFacet(item, locale),
            )}
          />
        </div>
      ) : null}
      {authorizedPrivateInsights.topPrivateDomains.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            {dict.common.privateInsightsTopDomains}
          </p>
          <ChipList
            items={authorizedPrivateInsights.topPrivateDomains.map((item) =>
              localizePrivateFacet(item, locale),
            )}
          />
        </div>
      ) : null}
      {privateExposureMode === "include" &&
      authorizedPrivateInsights.privateShowcaseRepos.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {dict.common.privateInsightsShowcase}
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              {dict.common.privateInsightsShowcaseHint}
            </p>
          </div>
          <div className="space-y-3">
            {authorizedPrivateInsights.privateShowcaseRepos.map((repo) => (
              <article
                className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
                key={repo.repoUrl}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">{repo.name}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {repo.description}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {formatDate(repo.updatedAt, locale)}
                  </p>
                </div>
                {repo.tech.length > 0 ? (
                  <div className="mt-4">
                    <ChipList items={repo.tech} />
                  </div>
                ) : null}
                <p className="mt-4 text-sm leading-6 text-neutral-500">
                  {repo.whyItStandsOut}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
                  <a
                    className="break-all underline decoration-black/20 underline-offset-4"
                    href={repo.repoUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {dict.common.repoLink}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-neutral-500">{visibilityNote}</p>
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
  analysis: GitHubPrintAnalysis;
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

export function EvidenceList({ analysis }: { analysis: GitHubPrintAnalysis }) {
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
