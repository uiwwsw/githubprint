import assert from "node:assert/strict";
import test from "node:test";
import { buildDocumentHtml } from "../lib/document-html";
import type { DocumentBlock } from "../lib/document-snapshot";

const makeHtml = (blocks: DocumentBlock[], extra = {}) =>
  buildDocumentHtml({
    blocks,
    locale: "ko",
    title: "김개발 · Resume",
    templateLabel: "Resume",
    font: new Uint8Array([1, 2, 3]),
    fontLicense: "SIL OPEN FONT LICENSE",
    ...extra,
  });

test("HTML escapes untrusted document text, attributes and license content", () => {
  const html = makeHtml(
    [
      {
        kind: "title",
        runs: [{ text: '<img src=x onerror="alert(1)"> & 이력서' }],
      },
      {
        kind: "paragraph",
        runs: [
          { text: "bad", href: "javascript:alert(1)" },
          {
            text: "bad data",
            href: "data:text/html,<script>alert(1)</script>",
          },
          {
            text: "safe",
            href: 'https://example.com/?q="&p=<x>',
            bold: true,
            italic: true,
          },
        ],
      },
    ],
    {
      title: "</title><script>alert(2)</script>",
      fontLicense: "</template><script>alert(3)</script>",
    },
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="data:'));
  assert.ok(
    html.includes(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; 이력서",
    ),
  );
  assert.ok(html.includes('href="https://example.com/?q=%22&amp;p=%3Cx%3E"'));
  assert.ok(html.includes("<em><strong>safe</strong></em>"));
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(html.includes('name="referrer" content="no-referrer"'));
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
});

test("HTML embeds assets and retains every paragraph, list and safe contact link", () => {
  const blocks: DocumentBlock[] = [
    { kind: "title", runs: [{ text: "한글 résumé" }] },
    { kind: "heading", runs: [{ text: "경험" }] },
    { kind: "bullet", runs: [{ text: "첫째" }] },
    { kind: "bullet", runs: [{ text: "둘째" }] },
    ...Array.from(
      { length: 100 },
      (_, i): DocumentBlock => ({
        kind: "paragraph",
        runs: [{ text: `문단 ${i}\n다음 줄` }],
      }),
    ),
    { kind: "heading", runs: [{ text: "연락" }] },
    {
      kind: "paragraph",
      runs: [
        { text: "Email", href: "mailto:me@example.com" },
        { text: "Phone", href: "tel:+821012345678" },
      ],
    },
    { kind: "bullet", runs: [{ text: "마지막 항목" }] },
  ];
  const html = makeHtml(blocks, {
    avatar: new Uint8Array([4, 5, 6]),
    generatedAt: "2026-09-01T00:00:00Z",
  });
  for (let i = 0; i < 100; i++)
    assert.ok(html.includes(`문단 ${i}<br>다음 줄`));
  assert.equal((html.match(/<ul>/g) ?? []).length, 2);
  assert.equal((html.match(/<\/ul>/g) ?? []).length, 2);
  assert.ok(html.includes('href="#section-1"'));
  assert.ok(html.includes('id="section-1"'));
  assert.ok(html.includes('href="mailto:me@example.com"'));
  assert.ok(html.includes('href="tel:+821012345678"'));
  assert.ok(html.includes("data:font/ttf;base64,AQID"));
  assert.ok(html.includes("data:image/png;base64,BAUG"));
  assert.ok(html.includes('datetime="2026-09-01T00:00:00.000Z"'));
  assert.ok(html.includes("SIL OPEN FONT LICENSE"));
});

test("HTML handles absent outline, invalid dates and more than one title", () => {
  const html = makeHtml(
    [
      { kind: "title", runs: [{ text: "First" }] },
      { kind: "title", runs: [{ text: "Second" }] },
    ],
    { locale: "en", generatedAt: "invalid" },
  );
  assert.equal((html.match(/<h1>/g) ?? []).length, 1);
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(!html.includes("<aside>"));
  assert.ok(!html.includes("<time"));
  assert.ok(!html.includes("Invalid Date"));
});
