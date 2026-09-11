import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocumentHtml,
  type DocumentElement,
  type DocumentVisualSnapshot,
} from "../lib/document-html";

const element = (
  tag: string,
  text: string,
  attrs: Record<string, string> = {},
): DocumentElement => ({ tag, attrs, children: [text] });
const makeHtml = (children: DocumentElement[], extra = {}) => {
  const snapshot: DocumentVisualSnapshot = {
    root: {
      tag: "article",
      attrs: { "data-document": "", class: "document-page" },
      children,
    },
    css: ".document-page{color:#176b50}@font-face{font-family:Example;src:url(data:font/woff2;base64,AQID)}",
    printCss: ".document-page{font-size:10.5pt}",
    density: "comfortable",
  };
  return buildDocumentHtml({
    snapshot,
    locale: "ko",
    title: "김개발 Resume",
    fontLicense: "SIL OPEN FONT LICENSE",
    ...extra,
  });
};

test("template HTML escapes text and removes executable elements, handlers and unsafe destinations", () => {
  const html = makeHtml(
    [
      element("h1", '<img src=x onerror="alert(1)"> & 이력서'),
      element("script", "alert(1)"),
      element("iframe", "", { src: "https://untrusted.example" }),
      element("a", "bad", { href: "javascript:alert(1)", onclick: "alert(2)" }),
      element("a", "bad data", { href: "data:text/html,evil" }),
      element("a", "safe", { href: 'https://example.com/?q="&p=<x>' }),
      element("div", "styled", {
        style: "background:url(https://untrusted.example)",
      }),
    ],
    {
      title: "</title><script>alert(2)</script>",
      fontLicense: "</template><script>alert(3)</script>",
    },
  );
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<iframe"));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="data:'));
  assert.ok(!html.includes('onclick="'));
  assert.ok(!html.includes("untrusted.example"));
  assert.ok(
    html.includes(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; 이력서",
    ),
  );
  assert.ok(html.includes('href="https://example.com/?q=%22&amp;p=%3Cx%3E"'));
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(html.includes('name="referrer" content="no-referrer"'));
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
});

test("HTML retains template hierarchy, classes, metadata, lists and inline emphasis without adding another layout", () => {
  const html = makeHtml([
    element("div", "Resume · September 1", { class: "document-meta" }),
    element("h1", "한글 résumé"),
    {
      tag: "section",
      attrs: { class: "resume-section", id: "experience" },
      children: [
        element("h2", "경력"),
        {
          tag: "div",
          attrs: { class: "grid sm:grid-cols-2" },
          children: [
            element("p", "왼쪽", { class: "rounded-xl bg-emerald-50" }),
            element("p", "오른쪽"),
          ],
        },
        {
          tag: "ol",
          attrs: { start: "3" },
          children: [element("li", "셋째"), element("li", "넷째")],
        },
      ],
    },
    element("a", "Email", { href: "mailto:me@example.com" }),
    element("img", "", { src: "data:image/png;base64,BAUG", alt: "Avatar" }),
    element("img", "", { src: "https://remote.example/private.png" }),
  ]);
  assert.ok(html.includes('class="grid sm:grid-cols-2"'));
  assert.ok(html.includes('class="rounded-xl bg-emerald-50"'));
  assert.ok(html.includes('<ol start="3"><li>셋째</li><li>넷째</li></ol>'));
  assert.ok(html.includes("document-meta"));
  assert.ok(html.includes('href="mailto:me@example.com"'));
  assert.ok(html.includes("data:font/woff2;base64,AQID"));
  assert.ok(html.includes("data:image/png;base64,BAUG"));
  assert.ok(!html.includes("remote.example"));
  assert.ok(!html.includes('class="topbar"'));
  assert.ok(!html.includes('class="outline"'));
  assert.ok(html.includes("SIL OPEN FONT LICENSE"));
});

test("Word measurement uses the shared print styles while standalone HTML retains responsive styles", () => {
  const html = makeHtml([element("h1", "Resume")], {
    locale: "en",
    printLayout: true,
  });
  assert.ok(html.includes('<html lang="en"'));
  assert.ok(html.includes("font-size:10.5pt"));
  assert.ok(!html.includes("color:#176b50"));
  assert.ok(html.includes("665.2px"));
});
