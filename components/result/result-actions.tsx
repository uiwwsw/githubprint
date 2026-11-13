"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DocumentOutline } from "@/components/result/document-outline";
import { getDictionary } from "@/lib/i18n";
import {
  buildDownloadFileName,
  buildResultDocumentTitle,
} from "@/lib/result-document";
import { snapshotDocument } from "@/lib/document-snapshot";
import { snapshotVisualDocument } from "@/lib/document-visual";
import type { ResumeRepoVisibility } from "@/lib/resume";
import type { Locale, PrivateExposureMode, TemplateId } from "@/lib/schemas";

type ExportFormat = "pdf" | "word" | "html";

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
  publicShare,
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
  // Only routes explicitly known to be public may offer link sharing.
  publicShare?: { path: string; kind: "example" | "public" };
}) {
  const dict = getDictionary(locale);
  const copy = dict.studio;
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState("comfortable");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fallbackLink, setFallbackLink] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const restorePrint = useRef<(() => void) | null>(null);
  const exporting = useRef(false);
  const mounted = useRef(false);
  const pendingRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingRequest.current?.abort();
      restorePrint.current?.();
      delete document.documentElement.dataset.printDensity;
    };
  }, []);
  useEffect(() => {
    if (fallbackLink) {
      linkInput.current?.focus();
      linkInput.current?.select();
    }
  }, [fallbackLink]);

  const filename = () =>
    buildDownloadFileName(
      downloadFileName ?? {
        generatedAt: new Date().toISOString(),
        template,
      },
    );

  function openDialog() {
    dialog.current?.showModal();
    setDialogOpen(true);
  }

  async function handlePdf() {
    if (exporting.current || !canDownload) return;
    exporting.current = true;
    setBusy("pdf");
    setError("");
    setStatus("");
    // Printing a modal would otherwise leave the document inert or obscured.
    dialog.current?.close();
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
      if (!mounted.current) return;
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
        if (mounted.current) setBusy(null);
      };
      const onFocus = () => window.setTimeout(restore, 500);
      restorePrint.current = restore;
      window.addEventListener("afterprint", restore, { once: true });
      window.addEventListener("focus", onFocus, { once: true });
      document.title = filename();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (mounted.current) window.print();
    } catch {
      restorePrint.current?.();
      exporting.current = false;
      if (mounted.current) {
        setBusy(null);
        setError(copy.printError);
      }
    }
  }

  async function handleFile(format: "word" | "html") {
    if (exporting.current || !canDownload) return;
    exporting.current = true;
    setBusy(format);
    setError("");
    setStatus("");
    const controller = new AbortController();
    pendingRequest.current = controller;
    try {
      const root = document.querySelector<HTMLElement>("[data-document]");
      if (!root) throw new Error("Document is unavailable");
      const blocks = snapshotDocument(root);
      if (!blocks.length) throw new Error("Document is empty");
      const name = filename();
      const fetchAsset = async (path: string) => {
        const response = await fetch(path, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15_000),
          ]),
        });
        if (!response.ok) throw new Error("Document asset is unavailable");
        return response;
      };
      const [{ snapshot, imageMissing }, license] = await Promise.all([
        snapshotVisualDocument(root, controller.signal, {
          embedFonts: format !== "word",
        }),
        format === "html"
          ? fetchAsset("/fonts/OFL.txt").then((response) => response.text())
          : Promise.resolve(""),
      ]);
      if (!mounted.current || controller.signal.aborted) return;
      let blob: Blob;
      if (format === "word") {
        const { snapshotDocumentLayout } = await import(
          "@/lib/document-layout"
        );
        const { buildDocumentDocx } = await import("@/lib/document-docx");
        const layout = await snapshotDocumentLayout(
          snapshot,
          locale,
          controller.signal,
        );
        blob = await buildDocumentDocx(layout, locale, name);
      } else {
        const { buildDocumentHtml } = await import("@/lib/document-html");
        blob = new Blob(
          [
            buildDocumentHtml({
              snapshot,
              locale,
              title: buildResultDocumentTitle({
                locale,
                template,
                username: downloadFileName?.username,
              }),
              fontLicense: license,
            }),
          ],
          { type: "text/html;charset=utf-8" },
        );
      }
      if (!mounted.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.${format === "word" ? "docx" : "html"}`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus(
        imageMissing
          ? copy.exportedWithoutImage
          : format === "html"
            ? copy.htmlExported
            : copy.exported,
      );
    } catch {
      if (mounted.current && !controller.signal.aborted)
        setError(copy.exportError);
    } finally {
      controller.abort();
      exporting.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  async function copyLink() {
    if (!publicShare) return;
    const url = new URL(publicShare.path, window.location.origin).href;
    setStatus("");
    setError("");
    setFallbackLink("");
    try {
      await navigator.clipboard.writeText(url);
      if (mounted.current) setStatus(copy.linkCopied);
    } catch {
      if (mounted.current) setFallbackLink(url);
    }
  }

  const feedback = (
    <>
      {status ? (
        <p role="status" className="toolbar-status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="toolbar-status">
          {error}
        </p>
      ) : null}
    </>
  );
  const formats = [
    {
      id: "pdf",
      name: "PDF",
      extension: ".pdf",
      use: copy.pdfUse,
      description: copy.pdfDescription,
      label: copy.pdf,
    },
    {
      id: "word",
      name: "Word",
      extension: ".docx",
      use: copy.wordUse,
      description: copy.wordDescription,
      label: copy.word,
    },
    {
      id: "html",
      name: "HTML",
      extension: ".html",
      use: copy.htmlUse,
      description: copy.htmlDescription,
      label: copy.html,
    },
  ] as const;

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
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M11 3 5 9l6 6" />
              </svg>
            </Link>
          ) : null}
          <p className="toolbar-title min-w-0">
            {dict.templateMeta[template].label}
            <span>A4</span>
          </p>
          {dataMode === "private_enriched" ||
          resumeRepoVisibility === "private" ? (
            <span className="toolbar-flag">
              {resumeRepoVisibility === "private"
                ? locale === "ko"
                  ? "비공개 원본"
                  : "Private source"
                : privateExposureMode === "include"
                  ? dict.result.privateExposureInclude
                  : locale === "ko"
                    ? "비공개 익명 요약"
                    : "Anonymous private summary"}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!canDownload || !!busy}
            onClick={openDialog}
            data-usage-target="export_open"
            aria-haspopup="dialog"
          >
            {copy.saveShare}
          </Button>
        </div>
      </div>
      <div className="toolbar-meta">
        <label>
          {copy.layout}
          <select
            aria-label={copy.layout}
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
        {canDownload ? (
          <DocumentOutline
            label={copy.contents}
            documentKey={`${locale}-${template}-${downloadFileName?.generatedAt ?? ""}`}
          />
        ) : null}
        {logoutHref ? (
          <a href={logoutHref} className="gp-text-link font-medium">
            {dict.home.authSignOut}
          </a>
        ) : null}
      </div>
      {!dialogOpen ? feedback : null}
      <dialog
        ref={dialog}
        className="export-dialog"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        onClose={() => setDialogOpen(false)}
      >
        <div className="export-dialog-heading">
          <div>
            <h2 id={dialogTitleId}>{copy.saveTitle}</h2>
            <p id={dialogDescriptionId}>{copy.saveIntro}</p>
          </div>
          <button
            type="button"
            className="export-dialog-close"
            aria-label={copy.close}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <div className="export-formats">
          {formats.map((format) => (
            <button
              type="button"
              key={format.id}
              className={`export-format export-format-${format.id}`}
              aria-label={format.label}
              disabled={!!busy}
              aria-busy={busy === format.id}
              onClick={() =>
                format.id === "pdf" ? handlePdf() : handleFile(format.id)
              }
            >
              <span className="export-format-name">{format.name}</span>
              <span className="export-format-use">{format.use}</span>
              <span className="export-format-description">
                {format.description}
              </span>
              <span className="export-format-action">
                {busy === format.id ? copy.pending : format.label}
              </span>
            </button>
          ))}
        </div>
        <div className="export-link-panel">
          <p>
            {publicShare?.kind === "example"
              ? copy.exampleShareHint
              : publicShare
                ? copy.publicShareHint
                : copy.privateShareHint}
          </p>
          {publicShare ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={!!busy}
              onClick={copyLink}
              data-usage-target="result_copy_link"
            >
              {publicShare.kind === "example"
                ? copy.copyExampleLink
                : copy.copyPublicLink}
            </Button>
          ) : null}
          {fallbackLink ? (
            <div className="export-link-fallback">
              <p role="status">{copy.copyLinkFallback}</p>
              <input
                ref={linkInput}
                aria-label={copy.shareLink}
                readOnly
                value={fallbackLink}
                onFocus={(event) => event.target.select()}
              />
            </div>
          ) : null}
        </div>
        {dialogOpen ? feedback : null}
        <details className="export-help">
          <summary>{copy.guide}</summary>
          <p>{copy.pdfHint}</p>
          <p>{copy.wordHint}</p>
          <p>{copy.htmlHint}</p>
          <p>{copy.exportHint}</p>
        </details>
      </dialog>
    </div>
  );
}
