import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getBaseMetadata } from "@/lib/seo";
import { getRouteLocale, type LocaleRouteParams } from "./locale";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource-variable/noto-serif-kr";
import "../globals.css";

export const metadata: Metadata = getBaseMetadata();

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: LocaleRouteParams;
}>) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head><link rel="preload" href="/fonts/SUITE-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
      <details data-ai-training-notice="true" className="ai-training-notice print:hidden"><summary>AI 학습·수집 반대 · AI training opt-out</summary><p>사전 서면 동의 없는 AI 학습·미세조정 및 학습용 데이터 수집에 반대합니다.</p><p lang="en">No AI training, fine-tuning or training-data collection without prior written consent.</p><p>기존 라이선스와 제삼자·사용자 콘텐츠의 권리는 유지됩니다. Existing licenses and third-party/user rights remain unchanged.</p><a href="/ai-training-notice.txt">전문 · Full notice</a></details>
      </body>
    </html>
  );
}
