import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  generateResultPageMetadata,
  ResultPageContent,
  type ResultPageSearchParams,
} from "@/components/pages/result-page-content";
import { templateSchema } from "@/lib/schemas";

type ResultTemplatePageProps = ResultPageSearchParams & {
  params: Promise<{ template: string }>;
};

async function resolveTemplate(
  paramsPromise: ResultTemplatePageProps["params"],
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
}: ResultTemplatePageProps): Promise<Metadata> {
  const template = await resolveTemplate(params);
  return generateResultPageMetadata({ locale: "ko", template });
}

export default async function ResultTemplatePage({
  params,
  searchParams,
}: ResultTemplatePageProps) {
  const template = await resolveTemplate(params);
  return <ResultPageContent locale="ko" searchParams={searchParams} template={template} />;
}
