"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRODUCT_SLUG } from "@/lib/brand";
import { getDictionary } from "@/lib/i18n";
import { scrollWindowToTopInstantly } from "@/lib/instant-scroll";
import { buildDownloadFileName } from "@/lib/result-document";
import { getTemplateMeta } from "@/lib/templates";
import {
  type Locale,
  type PrivateExposureMode,
  type TemplateId,
} from "@/lib/schemas";

export function ResultActions({
  template,
  mode,
  dataMode = "public",
  privateExposureMode = "aggregate",
  canDownload = true,
  backHref,
  downloadFileName,
  logoutHref,
  locale,
}: {
  template: TemplateId;
  mode: "openai" | "fallback";
  dataMode?: "public" | "private_enriched";
  privateExposureMode?: PrivateExposureMode;
  canDownload?: boolean;
  backHref?: string;
  downloadFileName?: {
    generatedAt: string;
    template: TemplateId;
    username?: string;
  };
  logoutHref?: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const templateMeta = getTemplateMeta(locale);

  function handleDownload() {
    const originalTitle = document.title;
    const nextTitle = downloadFileName
      ? buildDownloadFileName(downloadFileName)
      : `${PRODUCT_SLUG}-document`;
    let restored = false;

    const restoreTitle = () => {
      if (restored) {
        return;
      }
      restored = true;
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    document.title = nextTitle;
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
  }

  function handleScrollTop() {
    scrollWindowToTopInstantly();
  }

  return (
    <div className="screen-toolbar screen-only mx-auto flex w-full max-w-[210mm] items-start justify-between gap-3 sm:items-center">
      <div className="min-w-0 flex flex-1 flex-wrap items-center gap-2 text-sm text-neutral-600">
        {backHref ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-white/80"
            href={backHref}
            onClick={handleScrollTop}
            scroll
          >
            {dict.result.backToTemplate}
          </Link>
        ) : null}
        <span className="rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5">
          {dict.result.templateLabel}: {templateMeta[template].label}
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5">
          {dict.result.modeLabel}: {mode === "openai" ? dict.result.modeAi : dict.result.modeFallback}
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5">
          {dict.result.dataModeLabel}: {dataMode === "private_enriched" ? dict.result.dataModePrivate : dict.result.dataModePublic}
        </span>
        {dataMode === "private_enriched" ? (
          <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5">
            {dict.result.privateExposureLabel}:{" "}
            {privateExposureMode === "include"
              ? dict.result.privateExposureInclude
              : dict.result.privateExposureAggregate}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {logoutHref ? (
          <a
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-4 text-sm font-medium text-neutral-700 transition hover:bg-white"
            href={logoutHref}
          >
            {dict.home.authSignOut}
          </a>
        ) : null}
        <Button disabled={!canDownload} onClick={handleDownload}>
          {dict.result.download}
        </Button>
      </div>
    </div>
  );
}
