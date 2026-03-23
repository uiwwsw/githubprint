import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  generateResultPageMetadata,
  ResultPageContent,
  type ResultPageSearchParams,
} from "@/components/pages/result-page-content";
import { localeSchema, templateSchema } from "@/lib/schemas";

type ResultTemplatePageProps = ResultPageSearchParams & {
  params: Promise<{ locale: string; template: string }>;
};

async function resolveRouteData(
  paramsPromise: ResultTemplatePageProps["params"],
) {
  const params = await paramsPromise;
  const locale = localeSchema.safeParse(params.locale);
  const template = templateSchema.safeParse(params.template);

  if (!locale.success || !template.success) {
    notFound();
  }

  return {
    locale: locale.data,
    template: template.data,
  };
}

export async function generateMetadata({
  params,
}: ResultTemplatePageProps): Promise<Metadata> {
  const { locale, template } = await resolveRouteData(params);
  return generateResultPageMetadata({ locale, template });
}

export default async function ResultTemplatePage({
  params,
  searchParams,
}: ResultTemplatePageProps) {
  const { locale, template } = await resolveRouteData(params);
  return (
    <ResultPageContent
      locale={locale}
      searchParams={searchParams}
      template={template}
    />
  );
}
