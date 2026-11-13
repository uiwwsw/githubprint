import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TemplatePreview } from "@/components/home/template-preview";
import { LanguageLinks, SiteHeader } from "@/components/ui/site-header";
import { SiteFooter } from "@/components/ui/site-footer";
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
    <main className="min-h-screen">
      <StructuredData data={buildTemplateStructuredData(locale, template)} />
      <div className="gp-container">
        <SiteHeader locale={locale} label={copy.home}>
          <LanguageLinks
            locale={locale}
            koHref={getTemplateGuidePath(template, "ko")}
            enHref={getTemplateGuidePath(template, "en")}
          />
        </SiteHeader>
        <nav
          className="gp-breadcrumb"
          aria-label={locale === "ko" ? "현재 위치" : "Breadcrumb"}
        >
          <Link href={prefix || "/"}>{copy.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{dict.templateMeta[template].label}</span>
        </nav>
        <header className="gp-guide-hero">
          <div>
            <h1>{guide.title}</h1>
            <p className="gp-hero-lede">{guide.intro}</p>
            <div className="gp-hero-actions">
              <Link
                className="gp-button"
                href={`${prefix}/preview?template=${template}`}
              >
                {copy.preview}
              </Link>
              <Link className="gp-text-link" href={`${prefix}/#generator`}>
                {copy.start}
              </Link>
            </div>
            <p className="gp-hero-small">
              {locale === "ko"
                ? "A4 크기로 한국어와 영어 모두 만들 수 있고, PDF·Word·HTML로 저장됩니다."
                : "A4, in Korean or English, saved as PDF, Word or HTML."}
            </p>
          </div>
          <TemplatePreview locale={locale} template={template} />
        </header>
        <article className="gp-guide-body">
          <section>
            <h2>{copy.audience}</h2>
            <p>{guide.audience}</p>
          </section>
          <section>
            <h2>{copy.structure}</h2>
            <ol className="gp-guide-parts">
              {guide.sections.map(({ title, body }) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h2>{copy.preparation}</h2>
            <p>{guide.preparation}</p>
          </section>
          <section>
            <h2>{copy.exports}</h2>
            <p>{copy.exportBody}</p>
          </section>
        </article>
        <section
          className="gp-section"
          aria-labelledby="related-title"
          style={{ borderTop: 0 }}
        >
          <div className="gp-section-head">
            <h2 id="related-title">{copy.related}</h2>
          </div>
          <div className="gp-related">
            {TEMPLATE_IDS.filter((id) => id !== template).map((id) => (
              <Link key={id} href={getTemplateGuidePath(id, locale)}>
                <strong>{dict.templateMeta[id].label}</strong>
                <span>{getTemplateGuide(id, locale).title}</span>
              </Link>
            ))}
          </div>
        </section>
        <SiteFooter locale={locale} />
      </div>
    </main>
  );
}
