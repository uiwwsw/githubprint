"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { buildDownloadFileName } from "@/lib/result-document";
import { snapshotDocument } from "@/lib/document-snapshot";
import { readDocumentAvatar } from "@/lib/document-avatar";
import type { ResumeRepoVisibility } from "@/lib/resume";
import type { Locale, PrivateExposureMode, TemplateId } from "@/lib/schemas";

export function ResultActions({
  template,
  canDownload = true,
  backHref,
  downloadFileName,
  logoutHref,
  locale,
  dataMode = "public",
  privateExposureMode = "aggregate",
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
  resumeRepoVisibility?: ResumeRepoVisibility;
}) {
  const dict = getDictionary(locale);
  const copy = dict.studio;
  const [busy, setBusy] = useState<"pdf" | "word" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState("comfortable");
  const restorePrint = useRef<(() => void) | null>(null);
  const exporting = useRef(false);
  useEffect(
    () => () => {
      restorePrint.current?.();
      delete document.documentElement.dataset.printDensity;
    },
    [],
  );

  const filename = () =>
    buildDownloadFileName(
      downloadFileName ?? {
        generatedAt: new Date().toISOString(),
        template,
      },
    );

  async function handlePdf() {
    if (exporting.current) return;
    exporting.current = true;
    setBusy("pdf");
    setError("");
    setStatus("");
    try {
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(
            document.querySelectorAll<HTMLImageElement>(".document-page img"),
          ).map((img) => img.decode().catch(() => {})),
        ]),
        new Promise((resolve) => window.setTimeout(resolve, 5000)),
      ]);
      restorePrint.current?.();
      const previousTitle = document.title;
      let restored = false;
      const restore = () => {
        if (restored) return;
        restored = true;
        document.title = previousTitle;
        window.removeEventListener("afterprint", restore);
        window.removeEventListener("focus", onFocus);
        exporting.current = false;
        setBusy(null);
      };
      const onFocus = () => window.setTimeout(restore, 500);
      restorePrint.current = restore;
      window.addEventListener("afterprint", restore, { once: true });
      window.addEventListener("focus", onFocus, { once: true });
      document.title = filename();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      window.print();
    } catch {
      restorePrint.current?.();
      exporting.current = false;
      setBusy(null);
      setError(copy.printError);
    }
  }

  async function handleWord() {
    if (exporting.current) return;
    exporting.current = true;
    setBusy("word");
    setError("");
    setStatus("");
    try {
      const root = document.querySelector<HTMLElement>("[data-document]");
      if (!root) throw new Error("Document is unavailable");
      const blocks = snapshotDocument(root);
      if (!blocks.length) throw new Error("Document is empty");
      // Generate from the exact preview locally, without re-fetching personal data.
      const { buildDocumentDocx } = await import("@/lib/document-docx");
      const fonts = await Promise.all(
        ["Regular", "SemiBold"].map(async (weight) => {
          const response = await fetch(`/fonts/Pretendard-${weight}.ttf`, {
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) throw new Error("Document font is unavailable");
          return new Uint8Array(await response.arrayBuffer());
        }),
      );
      let avatarMissing = false;
      const avatar = await readDocumentAvatar(root).catch(() => {
        avatarMissing = true;
        return null;
      });
      const blob = await buildDocumentDocx(
        blocks,
        locale,
        filename(),
        fonts[0],
        fonts[1],
        avatar,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename()}.docx`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus(avatarMissing ? copy.exportedWithoutImage : copy.exported);
    } catch {
      setError(copy.exportError);
    } finally {
      exporting.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="screen-toolbar screen-only mx-auto w-full max-w-[210mm]">
      <div className="export-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              className="toolbar-back"
              href={backHref}
              aria-label={dict.result.backToTemplate}
            >
              ←
            </Link>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">{copy.documentReady}</p>
            <p className="font-semibold text-neutral-950">
              {dict.templateMeta[template].label}{" "}
              <span className="ml-1 text-xs font-normal text-neutral-500">
                / A4
              </span>
            </p>
          </div>
          {(dataMode === "private_enriched" &&
            privateExposureMode === "include") ||
          resumeRepoVisibility === "private" ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
              {dict.result.privateExposureInclude}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            className="gap-2 rounded-lg"
            disabled={!canDownload || !!busy}
            onClick={handlePdf}
            variant="secondary"
            aria-busy={busy === "pdf"}
          >
            <span aria-hidden="true">↓</span>
            {busy === "pdf" ? copy.pending : copy.pdf}
          </Button>
          <Button
            className="gap-2 rounded-lg bg-[#176b50] hover:bg-[#10503b]"
            disabled={!canDownload || !!busy}
            onClick={handleWord}
            aria-busy={busy === "word"}
          >
            <span aria-hidden="true">↓</span>
            {busy === "word" ? copy.pending : copy.word}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 text-xs text-neutral-500">
        <label className="flex items-center gap-2">
          {copy.layout}
          <select
            aria-label={copy.layout}
            className="rounded-md border border-black/10 bg-white px-2 py-1.5 text-neutral-700"
            value={density}
            disabled={!!busy}
            onChange={(event) => {
              setDensity(event.target.value);
              document.documentElement.dataset.printDensity =
                event.target.value;
            }}
          >
            <option value="comfortable">{copy.comfortable}</option>
            <option value="compact">{copy.compact}</option>
          </select>
        </label>
        {logoutHref ? (
          <a href={logoutHref} className="underline underline-offset-4">
            {dict.home.authSignOut}
          </a>
        ) : null}
        <details className="export-guide">
          <summary className="cursor-pointer">{copy.guide}</summary>
          <div className="mt-3 space-y-2 rounded-lg border border-black/10 bg-white p-4 text-xs leading-6 text-neutral-600">
            <p>{copy.pdfHint}</p>
            <p>{copy.wordHint}</p>
            <p>{copy.exportHint}</p>
          </div>
        </details>
      </div>
      {status ? (
        <p role="status" className="mt-2 text-xs text-[#176b50]">
          {status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
