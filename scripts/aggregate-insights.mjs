import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const cwd = process.cwd();
const insightDir = path.join(cwd, ".cache", "gitfolio", "insights");
const reportDir = path.join(cwd, ".cache", "gitfolio", "reports");
const summaryJsonPath = path.join(reportDir, "insights-summary.json");
const summaryMdPath = path.join(reportDir, "insights-summary.md");
const derivedBenchmarksPath = path.join(reportDir, "derived-benchmarks.json");

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function distribution(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p10: Math.round(percentile(sorted, 0.1)),
    p25: Math.round(percentile(sorted, 0.25)),
    p50: Math.round(percentile(sorted, 0.5)),
    p75: Math.round(percentile(sorted, 0.75)),
    p90: Math.round(percentile(sorted, 0.9)),
  };
}

function countTop(items, limit = 8) {
  const map = new Map();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ count, id }));
}

function avg(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildRecommendations(cohorts) {
  const recommendations = [];

  cohorts.forEach((cohort) => {
    if (cohort.sampleSize < 15) {
      recommendations.push(
        `${cohort.cohortId}: sample size is still small (${cohort.sampleSize}). Treat derived percentiles conservatively.`,
      );
    }

    if (cohort.averageConfidence < 55) {
      recommendations.push(
        `${cohort.cohortId}: average confidence is low (${cohort.averageConfidence}). Review signal coverage and narrative thresholds.`,
      );
    }

    if (cohort.lowConfidenceShare >= 0.35) {
      recommendations.push(
        `${cohort.cohortId}: low-confidence share is high (${Math.round(
          cohort.lowConfidenceShare * 100,
        )}%). Inspect common matched signals and representative repo quality.`,
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push(
      "No urgent weak spots were detected. Use the report to refine benchmark distributions and JSON rules gradually.",
    );
  }

  return recommendations;
}

function buildMarkdown(summary) {
  const lines = [];

  lines.push("# GitFolio Insight Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Snapshots: ${summary.snapshotCount}`);
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  summary.recommendations.forEach((item) => {
    lines.push(`- ${item}`);
  });
  lines.push("");

  summary.cohorts.forEach((cohort) => {
    lines.push(`## ${cohort.cohortId}`);
    lines.push("");
    lines.push(`- Sample size: ${cohort.sampleSize}`);
    lines.push(`- Average confidence: ${cohort.averageConfidence}`);
    lines.push(
      `- Low-confidence share: ${Math.round(cohort.lowConfidenceShare * 100)}%`,
    );
    lines.push(`- Demo rate: ${Math.round(cohort.demoRate * 100)}%`);
    lines.push(`- README rate: ${Math.round(cohort.readmeRate * 100)}%`);
    lines.push("");
    lines.push("### Derived metric distributions");
    lines.push("");
    cohort.metrics.forEach((metric) => {
      lines.push(
        `- ${metric.id}: p10 ${metric.distribution.p10}, p25 ${metric.distribution.p25}, p50 ${metric.distribution.p50}, p75 ${metric.distribution.p75}, p90 ${metric.distribution.p90}`,
      );
    });
    lines.push("");
    lines.push("### Top matched signals");
    lines.push("");
    cohort.topSignals.forEach((signal) => {
      lines.push(`- ${signal.id}: ${signal.count}`);
    });
    lines.push("");
    lines.push("### Common topics");
    lines.push("");
    cohort.topTopics.forEach((topic) => {
      lines.push(`- ${topic.id}: ${topic.count}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

async function readSnapshots() {
  try {
    const fileNames = (await readdir(insightDir)).filter((file) =>
      file.endsWith(".json"),
    );

    const snapshots = await Promise.all(
      fileNames.map(async (fileName) => {
        const fullPath = path.join(insightDir, fileName);
        const file = await readFile(fullPath, "utf-8");
        return JSON.parse(file);
      }),
    );

    return snapshots;
  } catch {
    return [];
  }
}

function groupByCohort(snapshots) {
  const groups = new Map();

  snapshots.forEach((snapshot) => {
    const cohortId = snapshot.benchmark?.cohortId ?? "unknown";
    const current = groups.get(cohortId) ?? [];
    current.push(snapshot);
    groups.set(cohortId, current);
  });

  return [...groups.entries()];
}

function buildCohortSummary([cohortId, snapshots]) {
  const metricIds = new Set();
  const allSignals = [];
  const allTopics = [];
  const derivedMetrics = [];

  snapshots.forEach((snapshot) => {
    snapshot.benchmark.metrics.forEach((metric) => metricIds.add(metric.id));
    allSignals.push(...snapshot.matchedSignalIds);
    snapshot.representativeRepos.forEach((repo) => {
      allTopics.push(...repo.topics);
    });
  });

  [...metricIds].forEach((metricId) => {
    const values = snapshots
      .map((snapshot) =>
        snapshot.benchmark.metrics.find((metric) => metric.id === metricId)?.value,
      )
      .filter((value) => typeof value === "number");

    derivedMetrics.push({
      distribution: distribution(values),
      id: metricId,
      label:
        snapshots[0].benchmark.metrics.find((metric) => metric.id === metricId)?.id ??
        metricId,
    });
  });

  const averageConfidence = Math.round(
    avg(snapshots.map((snapshot) => snapshot.benchmark.confidenceScore)),
  );
  const lowConfidenceShare =
    snapshots.filter((snapshot) => snapshot.benchmark.confidenceScore < 45).length /
    Math.max(1, snapshots.length);
  const demoRate =
    snapshots.flatMap((snapshot) => snapshot.representativeRepos).filter((repo) => repo.hasDemo)
      .length /
    Math.max(1, snapshots.flatMap((snapshot) => snapshot.representativeRepos).length);
  const readmeRate =
    snapshots.flatMap((snapshot) => snapshot.representativeRepos).filter((repo) => repo.hasReadme)
      .length /
    Math.max(1, snapshots.flatMap((snapshot) => snapshot.representativeRepos).length);

  return {
    averageConfidence,
    cohortId,
    demoRate,
    lowConfidenceShare,
    metrics: derivedMetrics,
    readmeRate,
    sampleSize: snapshots.length,
    topSignals: countTop(allSignals, 10),
    topTopics: countTop(allTopics, 10),
  };
}

function buildDerivedBenchmarks(cohorts) {
  return cohorts.map((cohort) => ({
    id: cohort.cohortId,
    label: {
      ko: `${cohort.cohortId} derived cohort`,
      en: `${cohort.cohortId} derived cohort`,
    },
    metrics: cohort.metrics.map((metric) => ({
      distribution: metric.distribution,
      id: metric.id,
      label: {
        ko: metric.id,
        en: metric.id,
      },
    })),
    sampleSize: cohort.sampleSize,
  }));
}

async function main() {
  const snapshots = await readSnapshots();

  await mkdir(reportDir, { recursive: true });

  if (snapshots.length === 0) {
    const empty = {
      cohorts: [],
      generatedAt: new Date().toISOString(),
      recommendations: [
        "No snapshots found. Run the app with GITFOLIO_CAPTURE_INSIGHTS=1 and analyze some profiles first.",
      ],
      snapshotCount: 0,
    };

    await writeFile(summaryJsonPath, JSON.stringify(empty, null, 2), "utf-8");
    await writeFile(
      summaryMdPath,
      "# GitFolio Insight Summary\n\nNo snapshots found.\n",
      "utf-8",
    );
    console.log(`Wrote ${summaryJsonPath}`);
    console.log(`Wrote ${summaryMdPath}`);
    return;
  }

  const cohorts = groupByCohort(snapshots)
    .map(buildCohortSummary)
    .sort((a, b) => b.sampleSize - a.sampleSize);
  const summary = {
    cohorts,
    generatedAt: new Date().toISOString(),
    recommendations: buildRecommendations(cohorts),
    snapshotCount: snapshots.length,
  };
  const derivedBenchmarks = buildDerivedBenchmarks(cohorts);

  await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2), "utf-8");
  await writeFile(summaryMdPath, buildMarkdown(summary), "utf-8");
  await writeFile(
    derivedBenchmarksPath,
    JSON.stringify(derivedBenchmarks, null, 2),
    "utf-8",
  );

  console.log(`Wrote ${summaryJsonPath}`);
  console.log(`Wrote ${summaryMdPath}`);
  console.log(`Wrote ${derivedBenchmarksPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
