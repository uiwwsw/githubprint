"use client";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { buildDownloadFileName } from "@/lib/result-document";
import { getTemplateMeta } from "@/lib/templates";
import { type Locale, type TemplateId } from "@/lib/schemas";

export function ResultActions({
  template,
  mode,
  canDownload = true,
  downloadFileName,
  locale,
}: {
  template: TemplateId;
  mode: "openai" | "fallback";
  canDownload?: boolean;
  downloadFileName?: {
    generatedAt: string;
    template: TemplateId;
    username?: string;
  };
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const templateMeta = getTemplateMeta(locale);

  function handleDownload() {
    const originalTitle = document.title;
    const nextTitle = downloadFileName
      ? buildDownloadFileName(downloadFileName)
      : "gitfolio-document";
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

  return (
    <div className="screen-toolbar screen-only mx-auto flex w-full max-w-[210mm] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        <span className="rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5">
          {dict.result.templateLabel}: {templateMeta[template].label}
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5">
          {dict.result.modeLabel}: {mode === "openai" ? dict.result.modeAi : dict.result.modeFallback}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!canDownload} onClick={handleDownload}>
          {dict.result.download}
        </Button>
      </div>
    </div>
  );
}
