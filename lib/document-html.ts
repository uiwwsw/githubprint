import { safeDocumentLink } from "@/lib/document-snapshot";
import type { Locale } from "@/lib/schemas";

export type DocumentElement = {
  tag: string;
  attrs: Record<string, string>;
  children: Array<DocumentElement | string>;
};
export type DocumentVisualSnapshot = {
  root: DocumentElement;
  css: string;
  printCss: string;
  density: string;
};
export const DOCUMENT_TAGS = new Set([
  "article",
  "section",
  "header",
  "footer",
  "aside",
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "a",
  "strong",
  "b",
  "em",
  "i",
  "small",
  "br",
  "hr",
  "img",
  "time",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
  "pre",
  "code",
]);
const SAFE_ATTRIBUTES =
  /^(class|id|title|role|alt|width|height|datetime|start|colspan|rowspan|aria-label|aria-hidden|data-document|data-document-group|data-document-fact)$/;
export const escapeDocumentHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function documentBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

export function renderDocumentElement(node: DocumentElement | string): string {
  if (typeof node === "string") return escapeDocumentHtml(node);
  if (!DOCUMENT_TAGS.has(node.tag)) return "";
  const attrs: string[] = [];
  for (const [key, value] of Object.entries(node.attrs)) {
    if (SAFE_ATTRIBUTES.test(key))
      attrs.push(`${key}="${escapeDocumentHtml(value)}"`);
    else if (key === "href" && node.tag === "a") {
      const href = value.startsWith("#") ? value : safeDocumentLink(value);
      if (href)
        attrs.push(
          `href="${escapeDocumentHtml(href)}" rel="noopener noreferrer"`,
        );
    } else if (
      key === "src" &&
      node.tag === "img" &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value)
    )
      attrs.push(`src="${value}"`);
    else if (
      key === "style" &&
      !/url\s*\(|expression\s*\(|@import|[<>]/i.test(value)
    )
      attrs.push(`style="${escapeDocumentHtml(value)}"`);
  }
  if (node.tag === "img" && !attrs.some((attr) => attr.startsWith("src=")))
    return "";
  const opening = `<${node.tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}>`;
  return /^(img|br|hr)$/.test(node.tag)
    ? opening
    : `${opening}${node.children.map(renderDocumentElement).join("")}</${node.tag}>`;
}

/** Keep the actual template markup, responsive styles, and print rules. No alternate document theme. */
export function buildDocumentHtml({
  snapshot,
  locale,
  title,
  fontLicense,
  printLayout = false,
}: {
  snapshot: DocumentVisualSnapshot;
  locale: Locale;
  title: string;
  fontLicense: string;
  printLayout?: boolean;
}) {
  const styles = (printLayout ? snapshot.printCss : snapshot.css).replace(
    /<\//g,
    "<\\/",
  );
  return `<!doctype html>
<html lang="${locale}" data-print-density="${snapshot.density === "compact" ? "compact" : "comfortable"}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>${escapeDocumentHtml(title)}</title>
<style>${styles}
.export-document-main{padding:16px 16px 32px}
@media(min-width:640px){.export-document-main{padding:32px 24px 48px}}
@media print{.export-document-main{padding:0!important}}
${printLayout ? ".export-document-main{padding:0!important}.document-page{width:665.2px!important;max-width:665.2px!important;margin:0!important}" : ""}
</style>
</head>
<body><main class="export-document-main">${renderDocumentElement(snapshot.root)}</main>
<template id="font-license">${escapeDocumentHtml(fontLicense)}</template>
</body></html>`;
}
