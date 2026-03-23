import { notFound } from "next/navigation";
import { localeSchema, type Locale } from "@/lib/schemas";

export type LocaleRouteParams = Promise<{ locale: string }>;

export type LocaleRouteProps = {
  params: LocaleRouteParams;
};

export async function getRouteLocale(
  paramsPromise: LocaleRouteParams,
): Promise<Locale> {
  const params = await paramsPromise;
  const parsedLocale = localeSchema.safeParse(params.locale);

  if (!parsedLocale.success) {
    notFound();
  }

  return parsedLocale.data;
}
