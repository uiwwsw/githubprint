# Why the percentile rankings were removed

## Audit of bd42ce6

- `data/benchmarks/cohorts.json` contained fixed p10–p90 anchors and sample sizes (for example, frontend: 1,280). The repository supplied no sampling frame, underlying observations, collection dates, external source, or validation supporting these as a GitHub population distribution.
- `lib/benchmark.ts` mapped heuristic scores to those anchors using linear interpolation, forced endpoints to the 1st and 99th percentiles, and averaged six percentile values for the overall rank. That average was never calibrated against a distribution of overall scores.
- `lib/benchmark-presentation.ts` displayed exact `Top N%` when the configured sample size was at least 120 and the heuristic confidence score at least 45. The confidence score was not statistical confidence. A weaker wording did not validate the reference data.
- The default calculation did not depend on joining order or the number of requests. A separate optional path captured public lookups and generated `derived-benchmarks.json`; an environment variable could replace the static anchors with that file. This was manual, not automatic online learning.
- That aggregation counted snapshots, not unique people. Repeated requests and language variants could inflate the apparent sample size and alter the distributions. Service visitors also form a self-selected group. Early users were not guaranteed high ranks, but neither sparse captures nor accumulated visits justified a rank against GitHub developers.

## Replacement

The analysis result now contains `evidenceReview` instead of a benchmark. Insight displays materials from the selected public, non-fork projects: readable READMEs, registered HTTP(S) project links, test configurations/directories actually present in fetched root paths, and profile pins. Counts refer to the explicitly stated reviewed scope. Each positive finding has a project name and source link; test findings name the observed path.

No rank, comparison band, aggregate score, cohort size, or confidence score is exposed. Counts are not a completion checklist or a quality assessment. A link does not prove a working deployment; a test configuration does not prove passing tests. If an item was not observed, the document explains that partial fetching may miss it and offers a practical way to document that material. No public non-fork projects produces a neutral empty state.

Private projects and forks are excluded defensively, URLs are validated, and duplicate repository URLs count once. Private narratives retain the user's selected disclosure behavior. Authored Resume content is unchanged. The evidence review has no dependency on service logs, signup order, star/follower counts, scoring weights, or benchmark override files. Analysis cache keys were versioned to prevent old result shapes from being reused.

The same rendered document supplies PDF, Word, and HTML exports. Both locales and template guide copy describe the new behavior. Unit tests cover counts, scope, missing data, misleading keywords, private data, duplicates, log independence, and diagnostic deduplication; browser checks verify the exported text and absence of rank labels.

If peer comparison is reconsidered, it needs an auditable source population, a reproducible sampling method, deduplication, collection/version metadata, and validation of each reported statistic. Request volume or a larger hardcoded sample size is insufficient.
