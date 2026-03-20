import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  generateResultPageMetadata,
  ResultPageContent,
  type ResultPageSearchParams,
} from "@/components/pages/result-page-content";
import { templateSchema } from "@/lib/schemas";

type EnglishResultTemplatePageProps = ResultPageSearchParams & {
  params: Promise<{ template: string }>;
};

async function resolveTemplate(
  paramsPromise: EnglishResultTemplatePageProps["params"],
) {
  const params = await paramsPromise;
  const template = templateSchema.safeParse(params.template);

  if (!template.success) {
    notFound();
  }

  return template.data;
}

export async function generateMetadata({
  params,
}: EnglishResultTemplatePageProps): Promise<Metadata> {
  const template = await resolveTemplate(params);
  return generateResultPageMetadata({ locale: "en", template });
}

export default async function EnglishResultTemplatePage({
  params,
  searchParams,
}: EnglishResultTemplatePageProps) {
  const template = await resolveTemplate(params);
  return <ResultPageContent locale="en" searchParams={searchParams} template={template} />;
}
