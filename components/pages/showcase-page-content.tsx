import type { ReactNode } from "react";
import Link from "next/link";
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

function ExternalLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/[0.08] bg-white/85 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white sm:w-auto"
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
    sourceRepo?.rootFiles.some((file) => file === "resume.yaml" || file === "resume.en.yaml"),
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
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
      {structuredData.map((entry, index) => (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          key={`${slug}-${locale}-${index}`}
          type="application/ld+json"
        />
      ))}

      <div className="mx-auto max-w-[1200px] space-y-5">
        <div className="screen-only flex flex-col gap-4 rounded-[1.4rem] border border-black/[0.08] bg-white/[0.72] p-4 shadow-[0_24px_64px_-44px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[1.8rem] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                {copy.publicSample}
              </p>
              <h1 className="break-words font-serif text-3xl text-neutral-950">
                {displayName}
              </h1>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/[0.08] bg-white/80 p-1 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.5)]">
              <Link
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  locale === "ko"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-black/[0.04]"
                }`}
                href={getShowcasePath(slug, "ko")}
              >
                KO
              </Link>
              <Link
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  locale === "en"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-black/[0.04]"
                }`}
                href={getShowcasePath(slug, "en")}
              >
                EN
              </Link>
            </div>
          </div>
          <p className="text-pretty text-sm leading-7 text-neutral-600">
            {copy.pageIntro}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.75)] transition hover:bg-neutral-800 sm:w-auto"
              href={homePath}
            >
              {copy.openHome}
            </Link>
            {canOpenSourceRepo ? (
              <ExternalLink href={showcase.resumeRepoUrl}>
                {copy.openRepo}
              </ExternalLink>
            ) : null}
            <ExternalLink href={`https://github.com/${showcase.username}`}>
              {copy.openGithub}
            </ExternalLink>
          </div>
        </div>

        {resume ? (
          <div>
            <ResumeTemplate
              generatedAt={resume.source.updatedAt ?? showcase.createdAt}
              locale={locale}
              profileUrl={`https://github.com/${showcase.username}`}
              resume={resume}
            />
          </div>
        ) : (
          <section className="rounded-[1.4rem] border border-black/[0.08] bg-white/[0.72] p-4 shadow-[0_24px_64px_-44px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[1.8rem] sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
              {copy.publicSample}
            </p>
            <h2 className="mt-3 break-words font-serif text-3xl text-neutral-950">
              {copy.fallbackTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
              {copy.fallbackBody}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
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
