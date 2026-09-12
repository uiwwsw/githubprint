import "server-only";

import reviewCopy from "@/data/templates/evidence-review.json";
import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import {
  evidenceReviewSchema,
  type EvidenceReview,
  type Locale,
} from "@/lib/schemas";

function webUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function testArtifact(repo: GitHubRepoSnapshot) {
  // Only inspect paths actually fetched from GitHub. A README keyword, .github
  // directory, dependency name, or commit message cannot establish a test setup.
  return [...repo.rootFiles]
    .sort()
    .find((file) =>
      /^(?:(?:playwright|vitest|jest|cypress)\.config\.(?:[cm]?[jt]s)|(?:tests?|__tests__|e2e|cypress))$/i.test(
        file,
      ),
    );
}

export function buildEvidenceReview(
  source: GitHubSourceData,
  locale: Locale,
): EvidenceReview {
  const seen = new Set<string>();
  const repos = source.representativeRepos.filter((repo) => {
    const url = webUrl(repo.repoUrl);
    const key = url?.replace(/\/$/, "").toLowerCase();
    if (repo.visibility !== "public" || repo.isFork || !key || seen.has(key))
      return false;
    seen.add(key);
    return true;
  });
  const copy = reviewCopy[locale];
  const items = (["readme", "links", "tests", "pinned"] as const).map((id) => {
    const evidence = repos.flatMap((repo) => {
      const url = webUrl(repo.repoUrl)!;
      switch (id) {
        case "readme":
          return repo.readme?.trim()
            ? [
                {
                  name: repo.name,
                  url: `${url.replace(/\/$/, "")}#readme`,
                  detail: "README",
                },
              ]
            : [];
        case "links": {
          const link = webUrl(repo.homepageUrl);
          return link
            ? [{ name: repo.name, url: link, detail: copy.linkLabel }]
            : [];
        }
        case "tests": {
          const artifact = testArtifact(repo);
          // Link to the inspected repository; root path names alone do not tell
          // us whether an entry is a file or directory, or that tests pass.
          return artifact ? [{ name: repo.name, url, detail: artifact }] : [];
        }
        case "pinned":
          return repo.isPinned
            ? [{ name: repo.name, url, detail: "Pinned" }]
            : [];
      }
    });
    return { id, ...copy.items[id], count: evidence.length, evidence };
  });
  return evidenceReviewSchema.parse({
    reviewedRepoCount: repos.length,
    scopeNote: copy.scopeNote,
    items,
  });
}
