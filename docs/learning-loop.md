# GitHubPrint Learning Loop

This document explains how GitHubPrint can improve as more profiles are analyzed, while still keeping the public product surface to two pages.

## Goal

GitHubPrint has two improvement layers:

1. **Manual rule tuning**
   - contributors update `data/signals/*.json`
   - contributors update `data/rules/*.json`
   - contributors update `data/templates/narratives.json`

2. **Internal insight loop**
   - GitHubPrint captures analysis snapshots during real profile lookups
   - those snapshots are aggregated into cohort summaries
   - contributors use the summaries to refine benchmark baselines and scoring rules

The second layer is what makes the system more accurate over time.

## Step 1. Capture internal snapshots

Enable snapshot capture:

```bash
GITHUBPRINT_CAPTURE_INSIGHTS=1 npm run dev
```

Every analyzed profile can write a compact internal snapshot to:

```text
.cache/githubprint/insights/
```

The snapshot includes:

- primary cohort
- confidence score
- benchmark metric values
- matched signal ids
- representative repo shape
- orientation and working-style scores

## Step 2. Aggregate snapshots

Run:

```bash
npm run insights:aggregate
```

This generates:

```text
.cache/githubprint/reports/insights-summary.json
.cache/githubprint/reports/insights-summary.md
.cache/githubprint/reports/derived-benchmarks.json
```

## Step 3. Read the report

The report helps answer:

- Which cohorts are under-sampled?
- Which cohorts have low average confidence?
- Which matched signals are overused or too dominant?
- Which topics appear repeatedly inside each cohort?
- How should percentile baselines shift based on actual usage?

## Step 4. Improve the system

Use the report to decide whether to:

- adjust signal weights in `data/signals/*.json`
- adjust orientation or working-style score caps in `data/rules/*.json`
- adjust strength or role thresholds in `data/rules/*.json`
- replace baseline benchmark distributions in `data/benchmarks/cohorts.json`

## Step 5. Optionally test derived benchmarks at runtime

You can point GitHubPrint at an aggregated benchmark file:

```bash
GITHUBPRINT_BENCHMARK_OVERRIDE_PATH=.cache/githubprint/reports/derived-benchmarks.json npm run dev
```

This lets you test the updated benchmark layer without manually copying the file into `data/`.

## What this does not do yet

This is not full online learning.

It does **not** automatically:

- rewrite rules
- retrain a model
- deploy new benchmark baselines
- resolve conflicting interpretations by itself

It gives contributors an internal service layer that turns real usage into structured evidence for the next improvement cycle.
