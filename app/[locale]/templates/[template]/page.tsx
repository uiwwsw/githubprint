import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TemplatePreview } from "@/components/home/template-preview";
import { StructuredData } from "@/components/seo/structured-data";
import { buildTemplateMetadata, buildTemplateStructuredData } from "@/lib/seo";
import { getDictionary } from "@/lib/i18n";
import { localeSchema, templateSchema } from "@/lib/schemas";
import {
  getTemplateGuide,
  getTemplateGuidePath,
  guideCopy,
  TEMPLATE_IDS,
} from "@/lib/template-guides";

type Props = { params: Promise<{ locale: string; template: string }> };

export function generateStaticParams() {
  return TEMPLATE_IDS.map((template) => ({ template }));
}

async function parseParams(params: Props["params"]) {
  const values = await params;
  const locale = localeSchema.safeParse(values.locale);
  const template = templateSchema.safeParse(values.template);
  if (!locale.success || !template.success) notFound();
  return { locale: locale.data, template: template.data };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, template } = await parseParams(params);
  return buildTemplateMetadata(locale, template);
}

export default async function TemplateGuidePage({ params }: Props) {
  const { locale, template } = await parseParams(params);
  setRequestLocale(locale);
  const guide = getTemplateGuide(template, locale);
  const copy = guideCopy[locale];
  const dict = getDictionary(locale);
  const prefix = locale === "en" ? "/en" : "";
  return (
    <main className="studio-home guide-page">
      <StructuredData data={buildTemplateStructuredData(locale, template)} />
      <div className="studio-container">
        <nav className="studio-nav" aria-label={copy.home}>
          <Link href={prefix || "/"} className="brand-wordmark">
            <span className="brand-mark">G/</span>GitHubPrint
          </Link>
          <Link
            className="guide-language"
            href={getTemplateGuidePath(template, locale === "ko" ? "en" : "ko")}
            hrefLang={locale === "ko" ? "en" : "ko"}
          >
            {locale === "ko" ? "English ↗" : "한국어 ↗"}
          </Link>
        </nav>
        <nav
          className="guide-breadcrumb"
          aria-label={locale === "ko" ? "현재 위치" : "Breadcrumb"}
        >
          <Link href={prefix || "/"}>{copy.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{dict.templateMeta[template].label}</span>
        </nav>
        <header className="guide-hero">
          <div>
            <p className="studio-eyebrow">
              {copy.overview} / {dict.templateMeta[template].label}
            </p>
            <h1>{guide.title}</h1>
            <p className="guide-intro">{guide.intro}</p>
            <div className="guide-actions">
              <Link
                className="studio-cta"
                href={`${prefix}/preview?template=${template}`}
              >
                {copy.preview}
                <span aria-hidden="true">↗</span>
              </Link>
              <Link className="guide-secondary" href={prefix || "/"}>
                {copy.start} →
              </Link>
            </div>
            <p className="guide-formats">
              A4 · PDF · DOCX ·{" "}
              {locale === "ko" ? "한국어 / 영어" : "Korean / English"}
            </p>
          </div>
          <div className={`guide-paper template-thumbnail-${template}`}>
            <TemplatePreview locale={locale} template={template} />
          </div>
        </header>
        <article className="guide-content">
          <section className="guide-audience">
            <h2>{copy.audience}</h2>
            <p>{guide.audience}</p>
          </section>
          <section>
            <h2>{copy.structure}</h2>
            <div className="guide-sections">
              {guide.sections.map(({ title, body }, index) => (
                <section key={title}>
                  <span className="step-index">0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </section>
              ))}
            </div>
          </section>
          <section>
            <h2>{copy.preparation}</h2>
            <p>{guide.preparation}</p>
          </section>
          <section>
            <h2>{copy.exports}</h2>
            <p>{copy.exportBody}</p>
            <Link
              className="guide-secondary"
              href={`${prefix}/preview?template=${template}`}
            >
              {copy.preview} →
            </Link>
          </section>
        </article>
        <aside className="guide-related" aria-labelledby="related-title">
          <h2 id="related-title">{copy.related}</h2>
          <div>
            {TEMPLATE_IDS.filter((id) => id !== template).map((id) => (
              <Link key={id} href={getTemplateGuidePath(id, locale)}>
                <strong>{dict.templateMeta[id].label} ↗</strong>
                <span>{getTemplateGuide(id, locale).title}</span>
              </Link>
            ))}
          </div>
        </aside>
        <footer className="studio-footer">
          <Link href={prefix || "/"}>GitHubPrint</Link>
          <p>{dict.studio.footer}</p>
          <Link href={`${prefix}/showcase`}>
            {locale === "ko" ? "공개 이력서 사례" : "Public resume showcase"}
          </Link>
        </footer>
      </div>
    </main>
  );
}
