import {
  safeDocumentLink,
  type DocumentBlock,
  type DocumentRun,
} from "@/lib/document-snapshot";
import type { Locale } from "@/lib/schemas";

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

function base64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function renderRun(run: DocumentRun) {
  let content = escapeHtml(run.text).replace(/\n/g, "<br>");
  if (run.bold) content = `<strong>${content}</strong>`;
  if (run.italic) content = `<em>${content}</em>`;
  const href = run.href && safeDocumentLink(run.href);
  return href
    ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${content}</a>`
    : content;
}

/** A portable document, with no app scripts, account state or remote assets. */
export function buildDocumentHtml({
  blocks,
  locale,
  title,
  templateLabel,
  generatedAt,
  font,
  fontLicense,
  avatar,
  notice,
}: {
  blocks: DocumentBlock[];
  locale: Locale;
  title: string;
  templateLabel: string;
  generatedAt?: string;
  font: Uint8Array;
  fontLicense: string;
  avatar?: Uint8Array | null;
  notice?: string;
}) {
  const copy =
    locale === "ko"
      ? {
          contents: "목차",
          document: "웹 문서",
          skip: "본문으로 바로가기",
          top: "문서 맨 위로",
          avatar: "프로필 사진",
        }
      : {
          contents: "Contents",
          document: "Web document",
          skip: "Skip to document",
          top: "Back to top",
          avatar: "Profile photo",
        };
  const headings = blocks.flatMap((block, index) =>
    block.kind === "heading"
      ? [
          {
            id: `section-${index}`,
            text: block.runs
              .map((run) => run.text)
              .join("")
              .trim(),
          },
        ]
      : [],
  );
  let inList = false;
  let hasTitle = false;
  const body =
    blocks
      .map((block, index) => {
        const runs = block.runs.map(renderRun).join("");
        const prefix = inList && block.kind !== "bullet" ? "</ul>" : "";
        const keep = block.keepNext ? ' class="keep-next"' : "";
        if (block.kind === "bullet") {
          const open = inList ? "" : "<ul>";
          inList = true;
          return `${open}<li${keep}>${runs}</li>`;
        }
        inList = false;
        switch (block.kind) {
          case "title": {
            const tag = hasTitle ? "h2" : "h1";
            hasTitle = true;
            return `${prefix}<${tag}>${runs}</${tag}>`;
          }
          case "heading":
            return `${prefix}<h2 id="section-${index}">${runs}</h2>`;
          case "subheading":
            return `${prefix}<h3>${runs}</h3>`;
          case "metadata":
            return `${prefix}<p class="metadata${block.keepNext ? " keep-next" : ""}">${runs}</p>`;
          default:
            return `${prefix}<p${keep}>${runs}</p>`;
        }
      })
      .join("\n") + (inList ? "</ul>" : "");
  const date = generatedAt ? new Date(generatedAt) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const dateHtml = validDate
    ? `<time datetime="${validDate.toISOString()}">${escapeHtml(new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(validDate))}</time>`
    : "";
  const outline =
    headings.length > 1
      ? `<aside><details class="outline" open><summary>${copy.contents}</summary><nav aria-label="${copy.contents}"><ol>${headings.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join("")}</ol></nav></details></aside>`
      : "";

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>
@font-face{font-family:Document;src:url(data:font/ttf;base64,${base64(font)}) format('truetype');font-weight:400;font-style:normal;font-display:swap}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}
body{margin:0;background:#edf0eb;color:#27362f;font:15px/1.8 Document,Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-wrap:anywhere}
html:lang(ko) body{word-break:keep-all;overflow-wrap:anywhere}
a{color:#176b50;text-underline-offset:3px}a:hover{text-decoration-thickness:2px}
a:focus-visible,summary:focus-visible{outline:2px solid #176b50;outline-offset:5px;border-radius:2px}
.skip{position:fixed;top:-100px;left:20px;z-index:10;padding:12px 20px;background:white}.skip:focus{top:12px}
.topbar{max-width:1140px;margin:0 auto;padding:28px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#536557;font-size:12px}
.brand{font-size:17px;font-weight:700;letter-spacing:-.5px;color:#173b2b}.brand span{margin-right:10px;color:#176b50}
.layout{display:grid;grid-template-columns:210px minmax(0,1fr);gap:36px;max-width:1140px;margin:0 auto;padding:0 24px 48px}.layout.solo{display:block;max-width:842px}
aside{min-width:0}.outline{position:sticky;top:24px;font-size:13px}.outline summary{font-weight:700;color:#304b39;cursor:pointer;padding:12px 0}.outline ol{padding:0 0 0 22px;margin:4px 0;max-height:70vh;overflow:auto}.outline li{padding:5px 0 5px 2px}.outline li::marker{color:#829582;font-size:11px}.outline a{color:#536557;text-decoration:none;display:block}.outline a:hover{color:#176b50;text-decoration:underline}
main{min-width:0;padding:48px;background:#fff;border:1px solid #dce2d9;border-top:3px solid #27674c;border-radius:3px;box-shadow:0 10px 45px -25px #183d2b40}
.document-meta{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:space-between;border-bottom:1px solid #e0e7df;padding-bottom:16px;margin-bottom:30px;color:#6a796c;font-size:11px;letter-spacing:.025em}
.avatar{float:right;width:80px;height:80px;object-fit:cover;border-radius:10px;margin:0 0 20px 24px}
article{display:flow-root}h1,h2,h3{color:#1c3024;font-weight:700;letter-spacing:-.035em;line-height:1.4}h1{font-size:38px;margin:0 0 20px;line-height:1.2}h2{clear:both;font-size:20px;margin:36px 0 16px;padding-bottom:10px;border-bottom:1px solid #d6e2d7;scroll-margin-top:24px}h3{font-size:16px;margin:24px 0 10px}
p{margin:0 0 12px}ul{padding-left:22px;margin:8px 0 18px}li{padding-left:3px;margin:5px 0}li::marker{color:#689376}strong{font-weight:700}.metadata{font-size:12px;line-height:1.8;color:#68776c}.notice{background:#f3f6f0;border-radius:6px;padding:10px 14px;font-size:12px;color:#536557;margin-bottom:24px}
.document-footer{border-top:1px solid #e0e7df;margin-top:36px;padding-top:16px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#68776c}
@media(max-width:850px){.layout{display:block;max-width:842px}.outline{position:static;background:#f7f9f4;border:1px solid #dce2d9;padding:0 18px;border-radius:8px;margin-bottom:20px}.outline ol{max-height:220px;padding-bottom:12px}.outline summary{padding:12px 0}}
@media(max-width:540px){body{font-size:14px;line-height:1.85}.topbar{padding:20px 16px}.layout{padding:0 12px 24px}main{padding:28px 22px}h1{font-size:30px}h2{font-size:19px}.avatar{width:64px;height:64px;margin-left:16px}.document-meta{margin-bottom:24px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{@page{size:A4;margin:17mm;@bottom-left{content:'GitHubPrint';font:8pt sans-serif;color:#727b76}@bottom-right{content:counter(page);font:8pt sans-serif;color:#727b76}}html{scroll-behavior:auto}body{background:white;color:#202e25;font-size:10.5pt;line-height:1.5}.topbar,aside,.skip,.back-top,.document-footer{display:none}.layout,.layout.solo{display:block;max-width:none;padding:0;margin:0}main{padding:0;border:0;border-radius:0;box-shadow:none}h1{font-size:28pt}h2{font-size:14pt;margin-top:20pt}h3{font-size:11pt}h1,h2,h3,.keep-next{break-after:avoid-page}p,li{orphans:3;widows:3}p{margin-bottom:7pt}.metadata{font-size:9pt}.avatar{width:18mm;height:18mm}.document-meta{margin-bottom:16pt}.document-footer{break-inside:avoid;break-before:avoid}.notice{background:none;padding:0}a{color:inherit;text-decoration:none}}
</style>
</head>
<body id="top">
<a class="skip" href="#document">${copy.skip}</a>
<header class="topbar"><span class="brand"><span aria-hidden="true">G/</span>GitHubPrint</span><span>${copy.document} · ${escapeHtml(templateLabel)}</span></header>
<div class="layout${outline ? "" : " solo"}">
${outline}
<main id="document" tabindex="-1">
<div class="document-meta"><span>${escapeHtml(templateLabel)}</span>${dateHtml}</div>
${notice ? `<p class="notice">${escapeHtml(notice)}</p>` : ""}
<article aria-label="${escapeHtml(title)}">
${avatar ? `<img class="avatar" src="data:image/png;base64,${base64(avatar)}" width="80" height="80" alt="${copy.avatar}">` : ""}
${body}
</article>
<footer class="document-footer"><span>GitHubPrint · ${copy.document}</span><a class="back-top" href="#top">${copy.top} ↑</a></footer>
</main>
</div>
<template id="font-license">${escapeHtml(fontLicense)}</template>
</body>
</html>`;
}
