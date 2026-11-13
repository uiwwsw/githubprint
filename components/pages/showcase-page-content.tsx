import type { ReactNode } from "react";
import Link from "next/link";
import { ResultActions } from "@/components/result/result-actions";
import { ResumeTemplate } from "@/components/templates/resume";
import { getRepoEntryFromUrl } from "@/lib/github";
import { buildShowcaseStructuredData } from "@/lib/seo";
import {
  getShowcaseDisplayName,
  getShowcasePath,
  getShowcaseRecord,
  type ShowcaseSlug,
} from "@/lib/showcase";
import { getPublicShowcaseResumeDocument } from "@/lib/showcase-resume";
import type { Locale } from "@/lib/schemas";
import { LanguageLinks, SiteHeader } from "@/components/ui/site-header";
import { StructuredData } from "@/components/seo/structured-data";

function ExternalLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className="gp-text-link"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export async function ShowcasePageContent({
  locale,
  slug,
}: {
  locale: Locale;
  slug: ShowcaseSlug;
}) {
  const showcase = getShowcaseRecord(slug);
  const resume = await getPublicShowcaseResumeDocument({
    locale,
    repoUrl: showcase.resumeRepoUrl,
    username: showcase.username,
  });
  const sourceRepo = await getRepoEntryFromUrl(showcase.resumeRepoUrl);
  const structuredData = buildShowcaseStructuredData(locale, slug, resume);
  const displayName = getShowcaseDisplayName(slug, resume);
  const homePath = locale === "en" ? "/en" : "/";
  const canOpenSourceRepo = sourceRepo?.visibility === "public";
  const isRepoReadable = Boolean(sourceRepo);
  const hasReadableManifest = Boolean(
    sourceRepo?.rootFiles.some(
      (file) => file === "resume.yaml" || file === "resume.en.yaml",
    ),
  );
  const copy =
    locale === "ko"
      ? {
          fallbackBody: !isRepoReadable
            ? "연결된 `resume` 레포에 아직 접근하지 못했습니다. 레포 이름/소유자가 맞는지 확인하고, 비공개 레포라면 서버 `GITHUB_TOKEN` 에 해당 레포 접근 권한이 포함되어 있어야 합니다."
            : !hasReadableManifest
              ? "연결된 `resume` 레포에는 아직 읽을 수 있는 `resume.yaml`이 없습니다. 필요하면 `resume.en.yaml`도 함께 두고, 루트에 manifest 파일이 보이도록 맞춰야 합니다."
              : "연결된 `resume` 레포는 읽었지만 아직 문서를 만들 수 없었습니다. `resume.yaml`과 필요한 경우 `resume.en.yaml` 구조, 그리고 참조한 Markdown 경로를 다시 확인해 주세요.",
          fallbackTitle: !isRepoReadable
            ? "resume 레포에 접근하지 못했습니다"
            : !hasReadableManifest
              ? "resume manifest를 찾지 못했습니다"
              : "resume 문서를 아직 만들지 못했습니다",
          openGithub: "GitHub 프로필",
          openHome: "GitHubPrint 홈",
          openRepo: "resume 레포 보기",
          pageIntro:
            "연결된 resume 레포의 최신 내용을 GitHubPrint Resume 레이아웃으로 렌더링한 공개 이력서입니다.",
          publicSample: "공개 이력서",
        }
      : {
          fallbackBody: !isRepoReadable
            ? "The connected `resume` repository is not readable yet. Check that the owner and repo name are correct, and if the repo is private make sure the server `GITHUB_TOKEN` can access it."
            : !hasReadableManifest
              ? "The connected `resume` repository is readable, but no root-level `resume.yaml` was found yet. Add `resume.en.yaml` too if you keep a separate English manifest."
              : "The connected `resume` repository was readable, but the document still could not be built. Recheck the `resume.yaml` structure and any referenced Markdown paths.",
          fallbackTitle: !isRepoReadable
            ? "Cannot access the resume repository"
            : !hasReadableManifest
              ? "Cannot find the resume manifest"
              : "Cannot build the resume document yet",
          openGithub: "GitHub profile",
          openHome: "GitHubPrint home",
          openRepo: "View resume repo",
          pageIntro:
            "This public resume renders the latest content from the connected resume repository in GitHubPrint's Resume layout.",
          publicSample: "Public resume",
        };

  return (
    <main className="min-h-screen pb-16">
      <StructuredData data={structuredData} />

      <div className="gp-container space-y-4">
        <SiteHeader locale={locale}>
          <LanguageLinks
            locale={locale}
            koHref={getShowcasePath(slug, "ko")}
            enHref={getShowcasePath(slug, "en")}
          />
        </SiteHeader>
        <header className="gp-page-head screen-only mx-auto max-w-[210mm]">
          <p className="gp-page-title break-words">{displayName}</p>
          <p>{copy.pageIntro}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {canOpenSourceRepo ? (
              <ExternalLink href={showcase.resumeRepoUrl}>
                {copy.openRepo}
              </ExternalLink>
            ) : null}
            <ExternalLink href={`https://github.com/${showcase.username}`}>
              {copy.openGithub}
            </ExternalLink>
            <Link className="gp-text-link" href={homePath}>
              {copy.openHome}
            </Link>
          </div>
        </header>

        {resume ? (
          <div className="space-y-6">
            <ResultActions
              template="resume"
              locale={locale}
              mode="fallback"
              backHref={homePath}
              publicShare={{
                path: `${locale === "en" ? "/en" : ""}/showcase`,
                kind: "public",
              }}
              downloadFileName={{
                generatedAt: resume.source.updatedAt ?? showcase.createdAt,
                template: "resume",
                username: showcase.username,
              }}
            />
            <ResumeTemplate
              generatedAt={resume.source.updatedAt ?? showcase.createdAt}
              locale={locale}
              profileUrl={`https://github.com/${showcase.username}`}
              resume={resume}
            />
          </div>
        ) : (
          <section className="gp-panel mx-auto max-w-[210mm]">
            <h1 className="break-words text-2xl font-extrabold tracking-[-0.03em] text-ink">
              {copy.fallbackTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink-soft">
              {copy.fallbackBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {canOpenSourceRepo ? (
                <ExternalLink href={showcase.resumeRepoUrl}>
                  {copy.openRepo}
                </ExternalLink>
              ) : null}
              <ExternalLink href={`https://github.com/${showcase.username}`}>
                {copy.openGithub}
              </ExternalLink>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
