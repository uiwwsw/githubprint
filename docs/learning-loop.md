# Rule diagnostics

Optional public-profile diagnostics help contributors inspect matched signals and tune rules manually. They never create user rankings, population estimates, percentile distributions, or a runtime baseline. More usage alone does not validate the rules.

Enable local capture with `GITHUBPRINT_CAPTURE_INSIGHTS=1 npm run dev`. Public analyses write version 2 diagnostic records to `.cache/githubprint/insights/`. Private analyses bypass capture. Records include the username, capture date, matched signals, repository metadata, and internal orientation/working-style scores. Internal scores are heuristic inputs, not measured ability or statistical confidence.

Run `npm run insights:aggregate` to create `insights-summary.json` and `insights-summary.md` in `.cache/githubprint/reports/`. The report keeps the latest valid record per case-insensitive username across locales, counts repeated and invalid records separately, and counts each signal once per profile. Existing records are accepted only for their diagnostic fields; old benchmark fields are ignored. No individual identities are included in the aggregate report.

The report can guide fixture review and manual changes to `data/signals/`, `data/rules/`, or `data/templates/`. It does not modify rules or feed values back into the public report. The old benchmark override environment variable and derived distribution output have been retired. Running the aggregate command also removes the obsolete generated `derived-benchmarks.json` file.

See [why rankings were removed](evidence-review.md) for the audit and replacement behavior.
