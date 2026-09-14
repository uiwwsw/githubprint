# Document exports

All four templates (Brief, Profile, Insight, Resume) support A4 PDF, editable Word `.docx`, and self-contained HTML exports. The toolbar has one **Save & share** action, with PDF, Word, and HTML inside the dialog. A keyboard-accessible document outline helps navigate longer previews. The public showcase exports the already-masked document, preserving its public visibility rules. `/preview` and `/en/preview` provide fictional examples without GitHub or OpenAI credentials.

## PDF

Choose **Save & share → Save PDF**, then **Save as PDF** in the browser print dialog. Use A4, 100% scale, and disable the browser's own headers and footers. The document supplies its own page numbers where CSS page-margin boxes are supported. Those running labels may be absent in older browsers; body content still prints.

Print styles in `app/globals.css` remove the app interface and screen padding, use 17 mm margins, reset screen-only grids to a readable document flow, keep headings with following content, and allow long entries to span pages. The print spacing selector offers comfortable and compact spacing without truncating content. This setting is captured by HTML print styles and the Word layout measurement too.

The print action waits for local fonts and image decoding (up to five seconds), sets the download filename through the page title, then restores it after printing or cancellation. Text and links remain selectable; PDF export does not rasterize the page.

## Word and Google Docs

Word export snapshots the current `[data-document]` element and generates the file in the browser. It does not rerun analysis or request resume data again. The snapshot includes the same template metadata, headings, facts, cards, columns, lists, and links. App controls and screen-only navigation are excluded. Profile images are embedded when readable; if an image cannot be loaded, a visible message explains that the file contains text only.

The `docx` library is loaded only when a Word download is requested. `lib/document-design.ts` supplies A4 dimensions, margins, heading styles, paragraph spacing, hyperlink colors, standard Word fonts, and page numbering. `lib/document-visual.ts` captures the template DOM and CSS. `lib/document-layout.ts` measures its A4 print layout in an isolated, script-free iframe, then `lib/document-docx.ts` maps typography, spacing, borders, backgrounds, images, and columns to native editable Word paragraphs and tables. Short cards remain together; long content can paginate.

Open the downloaded `.docx` directly in Word, or upload and open it in Google Docs. Google Docs import can substitute fonts and reflow pages; it is an editable import, not a native Google Docs API integration. Word follows the selected template’s print structure, card grouping, color, and type hierarchy. CSS-only details such as rounded card corners and inline badge padding have limited native Word equivalents. Line wrapping and pagination can differ between document apps. Text stays editable; the export is not a page screenshot.

Word uses Arial for Latin text and Malgun Gothic for Korean, with normal bold styling. It contains no font binaries, font obfuscation keys, document password, or editing protection. Missing local fonts can be substituted by the document app, so line wrapping and page count may differ. Word layout measurement uses the same standard font stack and does not fetch or bundle web font assets. PDF and offline HTML retain their template fonts and font licenses.

The existing authenticated `/api/resume-docx?lang=ko|en` endpoint is retained for integrations. It retains its server-side semantic resume layout and the same standard font policy, sends `private, no-store`, and continues to require the signed-in user's resume repository. Its data is fetched on request; the UI uses the current-preview export instead.

## HTML and sharing

Choose **Save & share → Save HTML** for a portable, responsive web document. Open the downloaded `.html` file in a browser. It preserves the actual template markup, responsive CSS, metadata, cards, type weights, colors, and A4 print styles. Used font families and Unicode subsets are embedded with the Pretendard and Noto Serif KR licenses, along with readable displayed photos and safe links. No alternate HTML theme, title header, or table-of-contents layout is added. Body text is searchable and selectable; there are no runtime scripts, analytics, app bundles, remote stylesheets, or image dependencies. Original outbound links still need a network connection when followed.

`lib/document-html.ts` renders escaped text and permits only HTTP, HTTPS, mailto, and tel links. An embedded Content Security Policy blocks scripts and remote subresources. A referrer policy avoids sending the file URL when following links. Exported HTML carries `noindex, nofollow` by default; this is an indexing preference, not access control. Anyone with the file can read it. Variable font weights and only the document’s needed glyph subsets are bundled, preserving the template typography while avoiding unused font files.

HTML is a downloaded file, not a hosted document or a live sync. It does not create a public URL. The explicitly public showcase offers **Copy public document link**; fictional previews offer **Copy example link**, preserving language and template. Personal result routes deliberately offer no URL sharing because they resolve to the signed-in viewer's account. Clipboard failures expose a selectable link rather than reporting a false success. Publishing personal documents would require a separate user-controlled publish/unpublish flow and is not performed by export.

The save dialog uses native modal focus handling, supports Escape and close, and closes before opening the PDF print dialog. Failed downloads can be retried, unavailable photos are disclosed, and navigation aborts pending resource requests. No document content is uploaded during file generation.

## Validation

- `npm run check`: production build, TypeScript, resume/showcase/proxy/SEO tests, HTML escaping and content tests, and analysis quality regressions.
- `npm run test:documents`: Chromium tests for all eight locale/template combinations, current-preview text parity, A4 OOXML, standard font references without embedded font parts, hyperlinks, page fields, mobile layouts, print title restoration, retry behavior, and long documents. HTML tests cover all eight locale/template combinations in an offline browser, text parity, desktop/mobile element geometry and computed styles against the original template, A4 print layout geometry, embedded fonts/photos, zero remote requests, modal keyboard behavior, clipboard fallback, and private-route sharing boundaries.
- Browser tests save artifacts to `.cache/document-qa/` for visual review. Inspect both browser PDF pages and DOCX pages rendered by a Word-compatible viewer. Check every page for clipped text, missing glyphs, stranded headings, and excessive empty space.

Live GitHub OAuth and remote private-avatar loading require local environment credentials and are not exercised by the public example tests.


## Word compatibility validation

An older export wrote `Pretendard SemiBold.odttf` as a ZIP entry with a raw space. The Microsoft Open XML SDK resolved its relationship to `/word/fonts/Pretendard%20SemiBold.odttf` and failed to open the package. The file had no document encryption or password. Removing embedded fonts eliminates that package relationship and obfuscation path in both browser exports and the authenticated resume endpoint.

After removing font parts, strict validation also found unnecessary paragraph border resets in an invalid element order and an invalid `w:cantSplit` false value. Exports now omit unused paragraph borders and omit the row setting when splitting is allowed. Visible template borders and short-row grouping remain intact.

Run `npm run test:documents`, then `npm run test:docx:structure`. The latter uses Microsoft's Open XML SDK 3.5.1 with Office 2019 validation rules to open the actual DOCX packages, validate all document parts, and reject embedded fonts or document protection. It needs a .NET 8 SDK; set `DOCX_DOTNET_PATH` if `dotnet` is not on PATH. Pass extra DOCX paths or directories after `--` to validate server-generated exports too. It fails when no files are present. Sources: [Microsoft document validation](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-validate-a-word-processing-document) and [Word font parts](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/1663dabc-5d98-463f-889e-bcd9b77c3d34).

ZIP integrity or a successful LibreOffice render alone does not prove Word compatibility. Keep package validation and rendered-page inspection as separate checks. Tests also block web-font assets during Word export and verify that the download succeeds. Existing downloaded files must be regenerated; deploying a fix cannot change those copies.
