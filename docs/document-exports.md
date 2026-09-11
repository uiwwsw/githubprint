# Document exports

All four templates (Brief, Profile, Insight, Resume) support A4 PDF, editable Word `.docx`, and self-contained HTML exports. **Save & share** explains each format; the toolbar also keeps a quick PDF action. A keyboard-accessible document outline helps navigate longer previews. The public showcase exports the already-masked document, preserving its public visibility rules. `/preview` and `/en/preview` provide fictional examples without GitHub or OpenAI credentials.

## PDF

Choose **Save PDF**, then **Save as PDF** in the browser print dialog. Use A4, 100% scale, and disable the browser's own headers and footers. The document supplies its own page numbers where CSS page-margin boxes are supported. Those running labels may be absent in older browsers; body content still prints.

Print styles in `app/globals.css` remove the app interface and screen padding, use 17 mm margins, reset screen-only grids to a readable document flow, keep headings with following content, and allow long entries to span pages. The PDF spacing selector offers comfortable and compact spacing without truncating content. Compact spacing affects PDF only.

The print action waits for local fonts and image decoding (up to five seconds), sets the download filename through the page title, then restores it after printing or cancellation. Text and links remain selectable; PDF export does not rasterize the page.

## Word and Google Docs

Word export snapshots the current `[data-document]` element and generates the file in the browser. It does not rerun analysis or request resume data again. Export controls, source visibility badges, and decorative metadata are excluded; headings, paragraphs, bullet lists, facts, and links are preserved. Profile images are embedded when readable; if an image cannot be loaded, a visible message explains that the file contains text only.

The `docx` library is loaded only when a Word download is requested. `lib/document-design.ts` supplies A4 dimensions, margins, heading styles, paragraph spacing, hyperlink colors, embedded fonts, and page numbering. `lib/document-snapshot.ts` preserves semantic reading order and keeps short entries together while allowing long entries to paginate.

Open the downloaded `.docx` directly in Word, or upload and open it in Google Docs. Google Docs import can substitute fonts and reflow pages; it is an editable import, not a native Google Docs API integration. Word uses an editorial single-column layout suited to editing, while PDF preserves the document's web visual treatment. A4 size and content are shared, but page counts can differ between formats and viewers.

`public/fonts` contains the unmodified Pretendard Regular and SemiBold TTF files from the existing `pretendard` package. Both are embedded in exports and distributed under the included SIL Open Font License (`public/fonts/OFL.txt`). This adds approximately 2 MB to an exported file. Viewers that ignore embedded fonts need Pretendard installed or a compatible Korean fallback font.

The existing authenticated `/api/resume-docx?lang=ko|en` endpoint is retained for integrations. It uses the same document design and embedded fonts, sends `private, no-store`, and continues to require the signed-in user's resume repository. Its data is fetched on request; the UI uses the current-preview export instead.

## HTML and sharing

Choose **Save & share → Save HTML** for a portable, responsive web document. Open the downloaded `.html` file in a browser. It includes an inline Pretendard font (with its SIL license), the displayed profile photo when readable, safe links, a table of contents, and A4 print styles. All text comes from the same semantic snapshot used by Word. Body text is searchable and selectable; there are no runtime scripts, analytics, app bundles, remote stylesheets, or image dependencies. Original outbound links still need a network connection when followed.

`lib/document-html.ts` renders escaped text and permits only HTTP, HTTPS, mailto, and tel links. An embedded Content Security Policy blocks scripts and remote subresources. A referrer policy avoids sending the file URL when following links. Exported HTML carries `noindex, nofollow` by default; this is an indexing preference, not access control. Anyone with the file can read it. The regular font is embedded once, with synthesized bold text to keep the standalone file smaller.

HTML is a downloaded file, not a hosted document or a live sync. It does not create a public URL. The explicitly public showcase offers **Copy public document link**; fictional previews offer **Copy example link**, preserving language and template. Personal result routes deliberately offer no URL sharing because they resolve to the signed-in viewer's account. Clipboard failures expose a selectable link rather than reporting a false success. Publishing personal documents would require a separate user-controlled publish/unpublish flow and is not performed by export.

The save dialog uses native modal focus handling, supports Escape and close, and closes before opening the PDF print dialog. Failed downloads can be retried, unavailable photos are disclosed, and navigation aborts pending resource requests. No document content is uploaded during file generation.

## Validation

- `npm run check`: production build, TypeScript, resume/showcase/proxy/SEO tests, HTML escaping and content tests, and analysis quality regressions.
- `npm run test:documents`: Chromium tests for all eight locale/template combinations, current-preview text parity, A4 OOXML, embedded fonts, hyperlinks, page fields, mobile layouts, print title restoration, retry behavior, and long documents. HTML tests cover all eight locale/template combinations in an offline browser, text parity, embedded fonts/photos, zero remote requests, responsive layouts, modal keyboard behavior, clipboard fallback, and private-route sharing boundaries.
- Browser tests save artifacts to `.cache/document-qa/` for visual review. Inspect both browser PDF pages and DOCX pages rendered by a Word-compatible viewer. Check every page for clipped text, missing glyphs, stranded headings, and excessive empty space.

Live GitHub OAuth and remote private-avatar loading require local environment credentials and are not exercised by the public example tests.
