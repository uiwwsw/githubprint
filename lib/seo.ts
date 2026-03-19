import type { Metadata } from "next";
import { buildResultDocumentTitle } from "@/lib/result-document";
import type { Locale, TemplateId } from "@/lib/schemas";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

function localePath(pathname: "/" | "/result", locale: Locale, search?: Record<string, string>) {
  const url = new URL(pathname, getSiteUrl());
  url.pathname = getLocalizedPathname(pathname, locale);

  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: ["/favicon.svg"],
    },
  };
}

export function buildHomeMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const title = dict.metadata.homeTitle;
  const description = dict.metadata.homeDescription;

  return {
    title,
    description,
    keywords: dict.metadata.homeKeywords,
    alternates: {
      canonical: getLocalizedPathname("/", locale),
      languages: {
        ko: "/",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: dict.siteName,
      title,
      description,
      url: localePath("/", locale),
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildResultMetadata(
  locale: Locale,
  options?: { template?: TemplateId; username?: string },
): Metadata {
  const dict = getDictionary(locale);
  const title = buildResultDocumentTitle({
    locale,
    template: options?.template,
    username: options?.username,
  });
  const description = dict.metadata.resultDescription;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: getLocalizedPathname("/result", locale),
      languages: {
        ko: "/result",
        en: "/en/result",
      },
    },
    openGraph: {
      type: "article",
      siteName: dict.siteName,
      title,
      description,
      url: localePath("/result", locale),
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
