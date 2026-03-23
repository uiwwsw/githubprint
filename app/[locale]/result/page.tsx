import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocalizedResultPath } from "@/lib/i18n";
import { buildResultMetadata } from "@/lib/seo";
import { templateSchema } from "@/lib/schemas";
import { getRouteLocale, type LocaleRouteProps } from "../locale";

type ResultRedirectPageProps = LocaleRouteProps & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: LocaleRouteProps): Promise<Metadata> {
  const locale = await getRouteLocale(params);
  return buildResultMetadata(locale);
}

export default async function ResultRedirectPage({
  params,
  searchParams,
}: ResultRedirectPageProps) {
  const locale = await getRouteLocale(params);
  const resolvedSearchParams = await searchParams;
  const template = templateSchema.safeParse(
    getFirstValue(resolvedSearchParams.template),
  );
  const nextParams = new URLSearchParams();
  const privateValue = getFirstValue(resolvedSearchParams.private);
  const refreshValue = getFirstValue(resolvedSearchParams.refresh);

  if (privateValue === "1" || privateValue === "true") {
    nextParams.set("private", "1");
  }

  if (refreshValue) {
    nextParams.set("refresh", refreshValue);
  }

  const nextPath = getLocalizedResultPath(
    template.success ? template.data : "profile",
    locale,
  );
  const query = nextParams.toString();

  redirect(`${nextPath}${query ? `?${query}` : ""}`);
}
