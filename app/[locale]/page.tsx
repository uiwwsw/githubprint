import type { Metadata } from "next";
import { HomePageContent } from "@/components/pages/home-page-content";
import { buildHomeMetadata } from "@/lib/seo";
import { getRouteLocale, type LocaleRouteProps } from "./locale";

export async function generateMetadata({
  params,
}: LocaleRouteProps): Promise<Metadata> {
  const locale = await getRouteLocale(params);
  return buildHomeMetadata(locale);
}

export default async function LocalizedHomePage({
  params,
}: LocaleRouteProps) {
  const locale = await getRouteLocale(params);
  return <HomePageContent locale={locale} />;
}
