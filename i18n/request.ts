import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localeSchema } from "@/lib/schemas";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const parsedLocale = localeSchema.safeParse(requestedLocale);
  const locale = parsedLocale.success
    ? parsedLocale.data
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
