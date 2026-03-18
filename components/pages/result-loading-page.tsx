import { Suspense } from "react";
import { ResultLoading } from "@/components/result/result-loading";
import type { Locale } from "@/lib/schemas";

function ResultLoadingFallback() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <div className="screen-toolbar screen-only mx-auto flex w-full max-w-[210mm] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <div className="h-10 w-28 animate-pulse rounded-full bg-white/70" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-white/70" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-11 w-28 animate-pulse rounded-full bg-white/70" />
          </div>
        </div>
        <div className="document-page mx-auto rounded-[2rem] border border-black/[0.08] bg-white/[0.85] p-6 shadow-[0_40px_100px_-56px_rgba(0,0,0,0.45)] sm:p-9">
          <div className="h-4 w-32 animate-pulse rounded bg-black/[0.07]" />
          <div className="mt-4 h-5 w-72 animate-pulse rounded bg-black/[0.07]" />
          <div className="mt-5 h-4 w-24 animate-pulse rounded bg-black/[0.07]" />
          <div className="mt-4 h-14 w-3/4 animate-pulse rounded bg-black/[0.07]" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="h-24 animate-pulse rounded-[1.2rem] bg-black/[0.06]"
                key={index}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-52 animate-pulse rounded-[1.4rem] bg-black/[0.06]"
                key={index}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function ResultLoadingPageContent({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<ResultLoadingFallback />}>
      <ResultLoading locale={locale} />
    </Suspense>
  );
}
