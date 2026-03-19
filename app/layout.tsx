import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { LEGACY_LOCALE_HEADER_NAME, LOCALE_HEADER_NAME } from "@/lib/brand";
import { resolveLocale } from "@/lib/i18n";
import { getBaseMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = getBaseMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = resolveLocale(
    requestHeaders.get(LOCALE_HEADER_NAME) ??
      requestHeaders.get(LEGACY_LOCALE_HEADER_NAME),
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
