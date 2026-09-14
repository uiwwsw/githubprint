# AGENTS.md

Repository-wide guidance for agents working in `gitfolio`.

## Product boundaries

- Use only public GitHub evidence. Do not assert tenure, leadership, collaboration quality, or business impact unless the public evidence explicitly supports it.
- This product targets individual developer accounts. Do not expand organization-account behavior unless the task explicitly requires that product change.
- Report observed project materials with their source and scope; do not assign peer ranks, percentiles, ability scores, or statistical confidence.

## Preferred change surface

- Prefer data changes before engine changes.
  - Update `data/signals/*.json`, `data/rules/*.json`, or `data/repo-identity/rules.json` first when adjusting inference behavior.
  - Only change `lib/profile-features.ts`, `lib/rule-engine.ts`, or `lib/repo-identity.ts` when the data model itself is insufficient.
- Keep result-page changes aligned across both locales.
  - Check `app/result/page.tsx` and `app/en/result/page.tsx`.
  - Check dictionary coverage in `lib/i18n.ts` for any new user-facing text.

## Evidence review rules

- `lib/evidence-review.ts` inventories materials in selected public, non-fork projects. Do not derive ranks or reference populations from service logs, internal scoring, or hardcoded distributions.
- Keep source links, distinct repository counts, and the fetched scope explicit. An unobserved artifact is not proof that it is absent. Test setup is not test success; a registered link is not proof of a live deployment.
- If the review shape changes, update dependent paths together:
  - `lib/analyze.ts`
  - `components/result/common.tsx`
  - `components/templates/brief.tsx`
  - `components/templates/insight.tsx`
  - `scripts/run-quality-regressions.cjs`
- Keep both locales, private data boundaries, template guides, previews, and PDF/Word/HTML exports aligned.
- Internal diagnostic aggregation must deduplicate usernames across repeated requests and locales, and must never feed a user ranking.

## Result document rules

- The result page is a print-first document. Preserve A4/browser-PDF behavior when editing:
  - `components/result/result-actions.tsx`
  - `components/result/document-shell.tsx`
  - `app/globals.css`
- Download filename behavior depends on the result-document helpers and print title override.
  - If you change export naming, update both `lib/result-document.ts` and `components/result/result-actions.tsx`.
- SEO/title/favicon changes should go through `lib/seo.ts` and the App Router metadata flow.

## Development workflow

- Prefer fixture mode for UI work when live GitHub data is unnecessary:
  - `GITFOLIO_USE_FIXTURE=1 npm run dev`
- Avoid committing generated-file churn.
  - Revert accidental edits to `next-env.d.ts` before finishing.

## Validation

- For TypeScript or UI changes: run `npm run typecheck`.
- For scoring, evidence review, template, or inference changes: run `npm run quality:regress`.
- Before shipping broader changes: run `npm run check`.
- For Word export changes: generate files with `npm run test:documents`, then run `npm run test:docx:structure` (requires a .NET 8 SDK). Package validation and rendered-page inspection are separate requirements; a successful LibreOffice render alone is insufficient.

