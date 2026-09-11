import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSampleAnalysis,
  buildSampleResume,
  SAMPLE_DATE,
} from "@/fixtures/sample-document";
import { ResultActions } from "@/components/result/result-actions";
import { RenderTemplate } from "@/components/result/render-template";
import { buildPreviewMetadata } from "@/lib/seo";
import { getDictionary } from "@/lib/i18n";
import { localeSchema, templateSchema, type TemplateId } from "@/lib/schemas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  return buildPreviewMetadata(parsed.data);
}
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const parsedLocale = localeSchema.safeParse((await params).locale);
  if (!parsedLocale.success) notFound();
  const locale = parsedLocale.data;
  const selected = (await searchParams).template;
  const parsedTemplate = templateSchema.safeParse(selected ?? "resume");
  if (!parsedTemplate.success) notFound();
  const template = parsedTemplate.data;
  const dict = getDictionary(locale);
  const prefix = locale === "en" ? "/en" : "";
  return (
    <main className="preview-workspace min-h-screen px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-[210mm]">
        <nav className="screen-only mb-12 flex items-center justify-between">
          <Link href={`${prefix}/`} className="brand-wordmark">
            <span className="brand-mark">G/</span>GitHubPrint
          </Link>
          <Link
            className="text-sm text-neutral-600"
            href={`${locale === "ko" ? "/en" : ""}/preview?template=${template}`}
          >
            {locale === "ko" ? "English ↗" : "한국어 ↗"}
          </Link>
        </nav>
        <header className="screen-only mb-7">
          <p className="studio-eyebrow">DOCUMENT STUDIO</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {dict.studio.sampleTitle}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-500">
            {dict.studio.sampleSubtitle}
          </p>
          <nav
            className="template-tabs mt-6"
            aria-label={dict.studio.templates}
          >
            {(["brief", "profile", "insight", "resume"] as TemplateId[]).map(
              (id) => (
                <Link
                  key={id}
                  href={`${prefix}/preview?template=${id}`}
                  aria-current={template === id ? "page" : undefined}
                >
                  {dict.templateMeta[id].label}
                </Link>
              ),
            )}
          </nav>
        </header>
        <div className="space-y-6">
          <ResultActions
            key={`${locale}-${template}`}
            template={template}
            locale={locale}
            mode="fallback"
            backHref={`${prefix}/`}
            downloadFileName={{
              generatedAt: SAMPLE_DATE,
              template,
              username: "example",
            }}
          />
          <p className="screen-only sample-notice">{dict.studio.example}</p>
          {template === "resume" ? (
            <RenderTemplate
              template="resume"
              locale={locale}
              resumeDocument={buildSampleResume(locale)}
              generatedAt={SAMPLE_DATE}
              profileUrl="https://github.com/example"
            />
          ) : (
            <RenderTemplate
              template={template}
              locale={locale}
              analysisResult={buildSampleAnalysis(locale)}
              generatedAt={SAMPLE_DATE}
              profileUrl="https://github.com/example"
              dataMode="public"
            />
          )}
        </div>
      </div>
    </main>
  );
}
