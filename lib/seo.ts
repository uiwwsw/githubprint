import type { Metadata } from "next";
import { buildResultDocumentTitle } from "@/lib/result-document";
import type { Locale, TemplateId } from "@/lib/schemas";
import { getDictionary, getLocalizedPathname, getLocalizedResultPath } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

function localePath(
  pathname: "/" | "/result" | `/result/${TemplateId}`,
  locale: Locale,
  search?: Record<string, string>,
) {
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
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: ["/favicon.ico"],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export function buildHomeMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const title = dict.metadata.homeTitle;
  const description = dict.metadata.homeDescription;

  return {
    applicationName: dict.siteName,
    category: locale === "ko" ? "개발자 이력서 생성기" : "Developer resume builder",
    title,
    description,
    keywords: dict.metadata.homeKeywords,
    alternates: {
      canonical: getLocalizedPathname("/", locale),
      languages: {
        ko: "/",
        en: "/en",
        "x-default": "/",
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

export function buildHomeStructuredData(locale: Locale) {
  const dict = getDictionary(locale);
  const url = localePath("/", locale);
  const inLanguage = locale === "ko" ? "ko-KR" : "en-US";
  const description = dict.metadata.homeDescription;
  const featureList =
    locale === "ko"
      ? [
          "GitHub를 이력서와 개발자 소개 문서로 변환",
          "공유 가능한 개발자 포트폴리오 PDF 생성",
          "resume 저장소 기반 ATS 친화 Word 이력서 생성",
          "한국어와 영어 결과 문서 지원",
        ]
      : [
          "Turn GitHub into a developer resume and profile document",
          "Generate shareable developer portfolio PDFs",
          "Create an ATS-friendly Word resume from a GitHub resume repository",
          "Support Korean and English output",
        ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: dict.siteName,
      url,
      inLanguage,
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: dict.siteName,
      url,
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      inLanguage,
      description,
      featureList,
    },
  ];
}

export function buildResultMetadata(
  locale: Locale,
  options?: { template?: TemplateId; username?: string },
): Metadata {
  const dict = getDictionary(locale);
  const resultPathname: "/" | "/result" | `/result/${TemplateId}` =
    options?.template ? `/result/${options.template}` : "/result";
  const localizedCanonicalPath = options?.template
    ? getLocalizedResultPath(options.template, locale)
    : getLocalizedPathname("/result", locale);
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
      noarchive: true,
      noimageindex: true,
      nosnippet: true,
      googleBot: {
        index: false,
        follow: false,
        noarchive: true,
        noimageindex: true,
        nosnippet: true,
        "max-image-preview": "none",
        "max-snippet": 0,
      },
    },
    alternates: {
      canonical: localizedCanonicalPath,
      languages: {
        ko: options?.template ? `/result/${options.template}` : "/result",
        en: options?.template ? `/en/result/${options.template}` : "/en/result",
        "x-default": options?.template ? `/result/${options.template}` : "/result",
      },
    },
    openGraph: {
      type: "article",
      siteName: dict.siteName,
      title,
      description,
      url: localePath(resultPathname, locale),
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
