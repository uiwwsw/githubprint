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
import { readDocumentAvatar } from "@/lib/document-avatar";
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
      let avatarMissing = false;
      const [fonts, avatar, license] = await Promise.all([
        Promise.all(
          (format === "word" ? ["Regular", "SemiBold"] : ["Regular"]).map(
            async (weight) =>
              new Uint8Array(
                await (
                  await fetchAsset(`/fonts/Pretendard-${weight}.ttf`)
                ).arrayBuffer(),
              ),
          ),
        ),
        readDocumentAvatar(root, controller.signal).catch(() => {
          avatarMissing = true;
          return null;
        }),
        format === "html"
          ? fetchAsset("/fonts/OFL.txt").then((response) => response.text())
          : "",
      ]);
      if (!mounted.current || controller.signal.aborted) return;
      let blob: Blob;
      if (format === "word") {
        const { buildDocumentDocx } = await import("@/lib/document-docx");
        blob = await buildDocumentDocx(
          blocks,
          locale,
          name,
          fonts[0],
          fonts[1],
          avatar,
        );
      } else {
        const { buildDocumentHtml } = await import("@/lib/document-html");
        blob = new Blob(
          [
            buildDocumentHtml({
              blocks,
              locale,
              title: buildResultDocumentTitle({
                locale,
                template,
                username: downloadFileName?.username,
              }),
              templateLabel: dict.templateMeta[template].label,
              generatedAt: downloadFileName?.generatedAt,
              font: fonts[0],
              fontLicense: license,
              avatar,
              notice:
                publicShare?.kind === "example" ? copy.example : undefined,
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
        avatarMissing
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
        <p role="status" className="mt-3 text-sm leading-6 text-[#176b50]">
          {status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
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
            onClick={openDialog}
            aria-haspopup="dialog"
          >
            {copy.saveShare}
            <span aria-hidden="true">↗</span>
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
        {canDownload ? (
          <DocumentOutline
            label={copy.contents}
            documentKey={`${locale}-${template}-${downloadFileName?.generatedAt ?? ""}`}
          />
        ) : null}
        {logoutHref ? (
          <a href={logoutHref} className="underline underline-offset-4">
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
            <p className="studio-eyebrow">SAVE YOUR DOCUMENT</p>
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
              <span className="export-format-top">
                <strong>{format.name}</strong>
                <span>{format.extension}</span>
              </span>
              <span className="export-format-use">{format.use}</span>
              <span className="export-format-description">
                {format.description}
              </span>
              <span className="export-format-action">
                {busy === format.id ? copy.pending : format.label}
                <span aria-hidden="true">↓</span>
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
