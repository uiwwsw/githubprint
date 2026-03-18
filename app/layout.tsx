import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
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
  const locale = resolveLocale(requestHeaders.get("x-gitfolio-locale"));

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
