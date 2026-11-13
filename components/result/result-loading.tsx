"use client";

import { useLocale } from "next-intl";
import { PageEnterScrollTop } from "@/components/ui/page-enter-scroll-top";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export function ResultLoading() {
  const locale = resolveLocale(useLocale());
  const dict = getDictionary(locale);

  return (
    <main className="min-h-screen">
      <PageEnterScrollTop />
      <div className="gp-container space-y-4 pb-16 pt-6">
        <div className="screen-only mx-auto w-full max-w-[210mm]">
          <div className="export-toolbar">
            <div className="h-6 w-32 animate-pulse rounded bg-desk" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-desk" />
          </div>
        </div>
        <div className="document-page mx-auto bg-paper p-6 sm:p-12" aria-busy="true">
          <p className="text-lg font-bold text-ink">{dict.result.loadingEyebrow}</p>
          <p className="mt-2 text-sm text-ink-soft" role="status">
            {dict.result.loadingMessage}
          </p>
          <div className="mt-10 h-12 w-2/3 animate-pulse rounded bg-desk" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-desk" />
          <div className="mt-8 h-0.5 w-full bg-desk" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="mt-8 space-y-3" key={index}>
              <div className="h-5 w-40 animate-pulse rounded bg-desk" />
              <div className="h-3 w-full animate-pulse rounded bg-desk" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-desk" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
