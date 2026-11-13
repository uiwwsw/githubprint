import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSampleAnalysis,
  buildSampleResume,
  SAMPLE_DATE,
} from "@/fixtures/sample-document";
import { LanguageLinks, SiteHeader } from "@/components/ui/site-header";
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
    <main className="min-h-screen pb-16">
      <div className="gp-container">
        <SiteHeader locale={locale}>
          <LanguageLinks
            locale={locale}
            koHref={`/preview?template=${template}`}
            enHref={`/en/preview?template=${template}`}
          />
        </SiteHeader>
        <header className="gp-page-head screen-only mx-auto max-w-[210mm]">
          <h1>{dict.studio.sampleTitle}</h1>
          <p>{dict.studio.sampleSubtitle}</p>
          <nav className="gp-tabs" aria-label={dict.studio.templates}>
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
            publicShare={{
              path: `${prefix}/preview?template=${template}`,
              kind: "example",
            }}
            downloadFileName={{
              generatedAt: SAMPLE_DATE,
              template,
              username: "example",
            }}
          />
          <p className="screen-only gp-sample-note">{dict.studio.example}</p>
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
