import type { Metadata } from "next";
import { ShowcasePageContent } from "@/components/pages/showcase-page-content";
import { buildShowcaseMetadata } from "@/lib/seo";
import { getShowcaseRecord } from "@/lib/showcase";
import { getPublicShowcaseResumeDocument } from "@/lib/showcase-resume";
import { getRouteLocale, type LocaleRouteProps } from "../locale";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: LocaleRouteProps): Promise<Metadata> {
  const locale = await getRouteLocale(params);
  const showcase = getShowcaseRecord("uiwwsw");
  const resume = await getPublicShowcaseResumeDocument({
    locale,
    repoUrl: showcase.resumeRepoUrl,
    username: showcase.username,
  });

  return buildShowcaseMetadata(locale, "uiwwsw", resume);
}

export default async function ShowcasePage({
  params,
}: LocaleRouteProps) {
  const locale = await getRouteLocale(params);
  return <ShowcasePageContent locale={locale} slug="uiwwsw" />;
}
