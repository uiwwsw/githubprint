import { mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Usage captures are a self-selected diagnostic set, never a peer population.
// A repeated lookup (including another locale) must not count as another person.
export function summarizeSnapshots(snapshots) {
  const latest = new Map();
  let invalidCount = 0;
  for (const snapshot of snapshots) {
    const username =
      typeof snapshot?.profile?.username === "string"
        ? snapshot.profile.username.trim().toLowerCase()
        : "";
    const time = Date.parse(snapshot?.generatedAt);
    if (
      !username ||
      !Number.isFinite(time) ||
      !Array.isArray(snapshot?.matchedSignalIds)
    ) {
      invalidCount += 1;
      continue;
    }
    const previous = latest.get(username);
    if (!previous || time > Date.parse(previous.generatedAt))
      latest.set(username, snapshot);
  }
  const signals = new Map();
  for (const snapshot of latest.values()) {
    for (const signal of new Set(
      snapshot.matchedSignalIds.filter((id) => typeof id === "string"),
    )) {
      signals.set(signal, (signals.get(signal) ?? 0) + 1);
    }
  }
  return {
    purpose:
      "Internal rule diagnostics only. Service users are not a representative GitHub population; these records never produce rankings or reference distributions.",
    capturedRecordCount: snapshots.length,
    uniqueProfileCount: latest.size,
    repeatedRecordCount: snapshots.length - invalidCount - latest.size,
    invalidRecordCount: invalidCount,
    signals: [...signals]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, profileCount]) => ({ id, profileCount })),
  };
}

async function main() {
  const insightDir = path.join(
    process.cwd(),
    ".cache",
    "githubprint",
    "insights",
  );
  const reportDir = path.join(
    process.cwd(),
    ".cache",
    "githubprint",
    "reports",
  );
  const files = await readdir(insightDir).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const snapshots = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map(async (file) => {
        try {
          return JSON.parse(
            await readFile(path.join(insightDir, file), "utf8"),
          );
        } catch {
          return null;
        }
      }),
  );
  const summary = {
    generatedAt: new Date().toISOString(),
    ...summarizeSnapshots(snapshots),
  };
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    path.join(reportDir, "insights-summary.json"),
    JSON.stringify(summary, null, 2),
  );
  await writeFile(
    path.join(reportDir, "insights-summary.md"),
    [
      "# GitHubPrint Rule Diagnostics",
      "",
      summary.purpose,
      "",
      `Captured records: ${summary.capturedRecordCount}`,
      `Unique profiles (latest record per username): ${summary.uniqueProfileCount}`,
      `Repeated records excluded: ${summary.repeatedRecordCount}`,
      `Invalid records excluded: ${summary.invalidRecordCount}`,
      "",
      "## Signals by unique profile",
      "",
      ...summary.signals.map(
        (signal) => `- ${signal.id}: ${signal.profileCount}`,
      ),
      "",
    ].join("\n"),
  );
  // Retire the old generated reference file when updating local diagnostics.
  await rm(path.join(reportDir, "derived-benchmarks.json"), { force: true });
  console.log(`Wrote diagnostics to ${reportDir}`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
