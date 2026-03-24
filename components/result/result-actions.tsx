"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRODUCT_SLUG } from "@/lib/brand";
import { getDictionary } from "@/lib/i18n";
import { scheduleWindowTopScroll } from "@/lib/instant-scroll";
import { getResumeCopy } from "@/lib/resume-copy";
import type { ResumeRepoVisibility } from "@/lib/resume";
import { buildDownloadFileName } from "@/lib/result-document";
import { getTemplateMeta } from "@/lib/templates";
import {
  type Locale,
  type PrivateExposureMode,
  type TemplateId,
} from "@/lib/schemas";

function parseAttachmentFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"(.*)"$/, "$1"));
    } catch {
      return utf8Match[1].trim().replace(/^"(.*)"$/, "$1");
    }
  }

  const plainMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  const unquotedMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  return unquotedMatch?.[1]?.trim() ?? null;
}

function isDocxContentType(contentType: string | null) {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();
  return (
    normalized.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ) || normalized.includes("application/octet-stream")
  );
}

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
  resumeDownloadUrl,
  resumeRepoVisibility,
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
  resumeDownloadUrl?: string;
  resumeRepoVisibility?: ResumeRepoVisibility;
}) {
  const dict = getDictionary(locale);
  const resumeCopy = getResumeCopy(locale);
  const templateMeta = getTemplateMeta(locale);
  const isResumeTemplate = template === "resume";
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  function handlePdfDownload() {
    setDownloadError(null);

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

  async function handleWordDownload() {
    setDownloadError(null);

    if (!resumeDownloadUrl || isDownloadingWord) {
      return;
    }

    setIsDownloadingWord(true);

    try {
      const response = await fetch(resumeDownloadUrl, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Resume download failed: ${response.status}`);
      }

      if (!isDocxContentType(response.headers.get("Content-Type"))) {
        throw new Error("Resume download returned a non-DOCX response.");
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Resume download returned an empty file.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackName = `${
        buildDownloadFileName(
          downloadFileName ?? {
            generatedAt: new Date().toISOString(),
            template: "resume",
          },
        )
      }.docx`;

      link.href = objectUrl;
      link.download =
        parseAttachmentFileName(response.headers.get("Content-Disposition")) ??
        fallbackName;
      link.style.display = "none";

      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch {
      setDownloadError(resumeCopy.actions.downloadWordFailed);
    } finally {
      setIsDownloadingWord(false);
    }
  }

  return (
    <div className="screen-toolbar screen-only mx-auto flex w-full max-w-[210mm] items-start justify-between gap-3 sm:items-center">
      <div className="min-w-0 flex flex-1 flex-wrap items-center gap-2 text-sm text-neutral-600">
        {backHref ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-white/80"
            href={backHref}
            onClick={scheduleWindowTopScroll}
            scroll={false}
          >
            {dict.result.backToTemplate}
          </Link>
        ) : null}
        <span className="rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5">
          {dict.result.templateLabel}: {templateMeta[template].label}
        </span>
        {isResumeTemplate && resumeRepoVisibility ? (
          <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5">
            {resumeCopy.actions.repoVisibilityLabel}:{" "}
            {resumeRepoVisibility === "private"
              ? resumeCopy.shared.private
              : resumeCopy.shared.public}
          </span>
        ) : !isResumeTemplate ? (
          <>
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
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {logoutHref ? (
            <a
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-4 text-sm font-medium text-neutral-700 transition hover:bg-white"
              href={logoutHref}
            >
              {dict.home.authSignOut}
            </a>
          ) : null}
          {isResumeTemplate ? (
            <>
              <Button
                disabled={!canDownload}
                onClick={handlePdfDownload}
                variant="secondary"
              >
                {dict.result.downloadPdf}
              </Button>
              <Button
                disabled={!canDownload || isDownloadingWord}
                onClick={handleWordDownload}
              >
                {isDownloadingWord
                  ? resumeCopy.actions.downloadWordPending
                  : resumeCopy.actions.downloadWord}
              </Button>
            </>
          ) : (
            <Button
              disabled={!canDownload}
              onClick={handlePdfDownload}
            >
              {dict.result.downloadPdf}
            </Button>
          )}
        </div>
        {downloadError ? (
          <p className="max-w-[20rem] text-right text-xs text-red-600">
            {downloadError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
