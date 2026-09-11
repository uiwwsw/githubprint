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
  const normalizedTitle = title.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const normalizedEyebrow = eyebrow
    ?.trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
  const showEyebrow =
    Boolean(normalizedEyebrow) && normalizedEyebrow !== normalizedTitle;

  return (
    <section className={cn("document-section", className)}>
      {showEyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-serif text-[1.4rem] leading-tight text-neutral-950",
          showEyebrow ? "mt-2" : "mt-0",
        )}
      >
        {title}
      </h2>
      <div className="mt-4 text-[15px] leading-7 text-neutral-700">
        {children}
      </div>
    </section>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="document-chips flex flex-wrap gap-2" data-document-group>
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
    <div className="document-facts grid gap-3 sm:grid-cols-3">
      <FactCard
        label={dict.common.factTech}
        value={analysis.facts.coreStack.slice(0, 3).join(", ")}
      />
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
        <FactCard
          label={dict.common.cohortLabel}
          value={benchmark.cohortLabel}
        />
        <FactCard
          label={dict.common.sampleSizeLabel}
          value={formatNumber(benchmark.sampleSize, locale)}
        />
      </div>
      {showInsight ? (
        <p className="text-sm leading-7 text-neutral-600">
          {benchmark.insight}
        </p>
      ) : null}
      {interpretationNote ? (
        <p className="text-sm leading-6 text-neutral-500">
          {interpretationNote}
        </p>
      ) : null}
      <div className="benchmark-metrics space-y-3">
        {benchmark.metrics.map((metric) => (
          <div
            className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
            data-document-group
            key={metric.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">
                {metric.label}
              </p>
              <span className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {formatBenchmarkRankLabel({
                  percentile: metric.percentile,
                  confidenceScore: benchmark.confidenceScore,
                  sampleSize: benchmark.sampleSize,
                  locale,
                })}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {metric.note}
            </p>
            {metric.evidence.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-neutral-500">
                {metric.evidence.slice(0, 2).map((item) => (
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
  compact = false,
}: {
  compact?: boolean;
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

  if (compact)
    return (
      <div className="document-source-note">
        <p>
          {dataMode === "private_enriched"
            ? locale === "ko"
              ? "공개 자료와 선택한 비공개 작업을 반영했습니다. 비교 지표는 공개 자료 기준입니다."
              : "Includes public sources and selected private work. Comparisons use public sources."
            : locale === "ko"
              ? "공개 프로필과 저장소의 설명·기술·활동을 바탕으로 작성했습니다."
              : "Based on the public profile and repository descriptions, technologies, and activity."}
        </p>
        {dataMode === "private_enriched" && authorizedPrivateInsights ? (
          <div className="mt-3" data-document-group>
            <p>
              {locale === "ko"
                ? `선택한 비공개 저장소 ${authorizedPrivateInsights.privateRepoCount}개 · 문서 ${authorizedPrivateInsights.documentedPrivateRepoCount}개 · 검증 ${authorizedPrivateInsights.verifiedPrivateRepoCount}개 · 자동화 ${authorizedPrivateInsights.automatedPrivateRepoCount}개`
                : `${authorizedPrivateInsights.privateRepoCount} selected private repositories · ${authorizedPrivateInsights.documentedPrivateRepoCount} documented · ${authorizedPrivateInsights.verifiedPrivateRepoCount} with verification · ${authorizedPrivateInsights.automatedPrivateRepoCount} with automation`}
            </p>
            {authorizedPrivateInsights.topPrivateStack.length ? (
              <p className="mt-2">
                {authorizedPrivateInsights.topPrivateStack.join(" · ")}
              </p>
            ) : null}
            <p className="mt-2">
              {privateExposureMode === "include"
                ? locale === "ko"
                  ? "선택한 비공개 프로젝트의 이름·설명·링크가 포함됩니다. 링크를 열려면 해당 저장소의 접근 권한이 필요합니다."
                  : "Includes names, descriptions, and links for selected private projects. Repository access is required to open their links."
                : locale === "ko"
                  ? "비공개 작업은 익명 집계로 표시합니다. 프로젝트 이름·설명·링크는 포함하지 않습니다."
                  : "Private work is summarized anonymously, without project names, descriptions, or links."}
            </p>
          </div>
        ) : null}
      </div>
    );

  return (
    <div
      className="space-y-3"
      data-document-group={dataMode === "public" || undefined}
    >
      {[items.profile, items.repositories, items.limits].map((item) => (
        <div
          className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
          data-document-group
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
        ? "선택한 비공개 프로젝트의 이름·설명·링크가 이 문서와 저장 파일에 포함됩니다. 링크를 열려면 별도의 GitHub 접근 권한이 필요합니다."
        : "Selected private project names, descriptions, and links are included in this document and saved files. Opening the links requires separate GitHub access."
      : locale === "ko"
        ? "선택한 작업의 익명 집계입니다. 이름·설명·링크·README 문장은 포함하지 않았습니다. 조합된 기술 정보로 프로젝트가 유추될 수 있으므로 공유 전에 검토하세요."
        : "Anonymous aggregates of selected work. Names, descriptions, links, and README text are excluded. Review before sharing: combinations of technology signals may still identify a project.";

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
          value={formatNumber(
            authorizedPrivateInsights.authorizedRepoCount,
            locale,
          )}
        />
        <FactCard
          label={dict.common.factPrivateRepos}
          value={formatNumber(
            authorizedPrivateInsights.privateRepoCount,
            locale,
          )}
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
      <p className="mt-4 text-sm leading-6 text-neutral-500">
        {visibilityNote}
      </p>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-document-fact
      className="rounded-[1.1rem] border border-black/[0.07] bg-black/[0.025] p-4"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
        {label}
      </p>
      <p className="mt-3 break-words text-sm font-medium text-neutral-900">
        {value}
      </p>
    </div>
  );
}

export function ProjectList({
  analysis,
  locale,
  variant = "default",
  limit,
}: {
  limit?: number;
  analysis: GitHubPrintAnalysis;
  locale: Locale;
  variant?: "default" | "compact" | "narrative";
}) {
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4">
      {analysis.projects.length === 0 ? (
        <div className="rounded-[1.3rem] border border-dashed border-black/10 bg-black/[0.02] p-5 text-sm text-neutral-500">
          {dict.common.noProjects}
        </div>
      ) : null}
      {analysis.projects.slice(0, limit).map((project, index) => (
        <article
          className={cn(
            "document-project print-break-inside-avoid",
            variant === "compact" && "document-project-compact",
          )}
          key={project.repoUrl}
        >
          {variant !== "compact" ? (
            <p className="project-index">
              {String(index + 1).padStart(2, "0")}
            </p>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-xl font-semibold tracking-[-0.01em] text-neutral-950">
                  {project.name}
                </h3>
                {project.stars > 0 && variant !== "compact" ? (
                  <span className="project-stars">
                    {project.stars} {dict.common.starsLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 break-words text-sm leading-6 text-neutral-600">
                {project.description}
              </p>
            </div>
            <div className="shrink-0 text-sm text-neutral-500">
              <p>{formatDate(project.updatedAt, locale)}</p>
            </div>
          </div>
          <div className="mt-4">
            <ChipList items={project.tech.slice(0, 4)} />
          </div>
          {variant !== "compact" ? (
            <p className="project-evidence mt-3 text-sm leading-7 text-neutral-500">
              {project.evidence}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
            <a
              className="break-all underline decoration-black/20 underline-offset-4"
              href={project.repoUrl}
              rel="noreferrer"
              target="_blank"
            >
              {dict.common.repoLink}
            </a>
            {project.homepageUrl ? (
              <a
                className="break-all underline decoration-black/20 underline-offset-4"
                href={project.homepageUrl}
                rel="noreferrer"
                target="_blank"
              >
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
        <div
          className="rounded-[1.1rem] border border-black/[0.08] bg-black/[0.025] p-4"
          data-document-group
          key={`${item.label}-${item.detail}`}
        >
          <p className="text-sm font-medium text-neutral-900">{item.label}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DocumentFooter({ disclaimer }: { disclaimer: string }) {
  return (
    <footer className="mt-8 border-t border-black/[0.08] pt-5 text-sm leading-6 text-neutral-500">
      <p>{disclaimer}</p>
    </footer>
  );
}

export function DocumentIdentity({
  analysis,
  profileUrl,
  summary,
  locale,
}: {
  analysis: GitHubPrintAnalysis;
  profileUrl: string;
  summary?: string;
  locale: Locale;
}) {
  return (
    <header className="document-identity">
      <div className="document-identity-top">
        <img
          className="document-avatar float-right"
          alt={analysis.profile.name}
          src={analysis.profile.avatarUrl}
        />
        <h1>{analysis.profile.name}</h1>
        <p className="identity-headline">{analysis.profile.headline}</p>
        <a
          className="identity-link"
          href={profileUrl}
          rel="noreferrer"
          target="_blank"
        >
          github.com/{analysis.profile.username}
        </a>
      </div>
      {summary ? (
        <div className="identity-introduction">
          <p className="identity-summary-label">
            {locale === "ko"
              ? "프로젝트 기반 소개"
              : "Introduction from project evidence"}
          </p>
          <p className="identity-summary">{summary}</p>
        </div>
      ) : null}
    </header>
  );
}

export function EditorialList({ items }: { items: string[] }) {
  return (
    <ul className="editorial-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
