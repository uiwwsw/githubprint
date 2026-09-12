const assert = require("node:assert/strict");
const test = require("node:test");
const { buildEvidenceReview } = require("../lib/evidence-review.ts");
const { evidenceReviewSchema } = require("../lib/schemas.ts");
const { mockGitHubProfile } = require("../fixtures/mock-profile.ts");
const { buildLearningSnapshot } = require("../lib/internal-insights.ts");

function repo(name, changes = {}) {
  return {
    ...structuredClone(mockGitHubProfile.representativeRepos[0]),
    name,
    repoUrl: `https://github.com/example/${name}`,
    visibility: "public",
    isFork: false,
    isPinned: false,
    readme: null,
    homepageUrl: "",
    rootFiles: [],
    ...changes,
  };
}
function source(repos) {
  return { ...structuredClone(mockGitHubProfile), representativeRepos: repos };
}
const item = (review, id) => review.items.find((value) => value.id === id);
const rankingKeys =
  /percentile|cohort|confidence|sampleSize|overallScore|benchmark/i;

for (const locale of ["ko", "en"]) {
  test(`review counts observed artifacts with source links and explicit scope (${locale})`, () => {
    const review = buildEvidenceReview(
      source([
        repo("web", {
          readme: "# Web",
          homepageUrl: "https://example.com",
          rootFiles: ["playwright.config.ts"],
          isPinned: true,
        }),
        repo("api", { readme: "# API", rootFiles: ["tests"] }),
        repo("notes"),
      ]),
      locale,
    );
    assert.equal(evidenceReviewSchema.safeParse(review).success, true);
    assert.equal(review.reviewedRepoCount, 3);
    assert.deepEqual(
      review.items.map((value) => value.count),
      [2, 1, 2, 1],
    );
    assert.deepEqual(
      item(review, "tests").evidence.map((value) => value.detail),
      ["playwright.config.ts", "tests"],
    );
    assert.equal(
      item(review, "readme").evidence[0].url,
      "https://github.com/example/web#readme",
    );
    assert.equal(item(review, "links").evidence[0].url, "https://example.com/");
    assert.doesNotMatch(JSON.stringify(review), rankingKeys);
    assert.match(
      review.scopeNote,
      locale === "ko" ? /일부 자료만 조회/ : /Only part/,
    );
  });
  test(`duplicates, forks, and private work do not enter the review (${locale})`, () => {
    const publicRepo = repo("web", { readme: "readme" });
    const review = buildEvidenceReview(
      source([
        publicRepo,
        { ...publicRepo, repoUrl: `${publicRepo.repoUrl.toUpperCase()}/` },
        repo("fork", { isFork: true, rootFiles: ["tests"] }),
        repo("secret", {
          visibility: "private",
          readme: "secret",
          homepageUrl: "https://secret.example",
        }),
      ]),
      locale,
    );
    assert.equal(review.reviewedRepoCount, 1);
    assert.equal(item(review, "readme").count, 1);
    assert.equal(item(review, "tests").count, 0);
    assert.doesNotMatch(JSON.stringify(review), /secret|fork"/i);
  });
  test(`empty and partially fetched repositories never invent assessments (${locale})`, () => {
    for (const repos of [[], [repo("empty")]]) {
      const review = buildEvidenceReview(source(repos), locale);
      assert.equal(review.reviewedRepoCount, repos.length);
      assert.ok(
        review.items.every(
          (value) => value.count === 0 && value.evidence.length === 0,
        ),
      );
      assert.ok(review.items.every((value) => value.nextStep.length > 0));
      assert.doesNotMatch(
        JSON.stringify(review),
        /Top \d|상위\s*\d|상위권|Above the middle|\/100/,
      );
    }
  });
}

test("keywords, .github, package manifests, and commits are not test configurations", () => {
  const review = buildEvidenceReview(
    source([
      repo("ambiguous", {
        readme: "testing e2e coverage CI test success",
        topics: ["testing", "playwright"],
        rootFiles: [
          ".github",
          "package.json",
          "test-notes.md",
          "contest",
          "testing.md",
        ],
        manifestContents: ['{"devDependencies":{"vitest":"1"}}'],
        recentCommitMessages: ["test: passing"],
      }),
    ]),
    "en",
  );
  assert.equal(item(review, "tests").count, 0);
});

test("non-web links are excluded, whitespace README does not count", () => {
  const review = buildEvidenceReview(
    source([
      repo("script", { readme: "  \n ", homepageUrl: "javascript:alert(1)" }),
      repo("data", { homepageUrl: "data:text/html,unsafe" }),
      repo("unsafe-repo", {
        repoUrl: "javascript:alert(1)",
        readme: "# unsafe",
      }),
    ]),
    "en",
  );
  assert.equal(review.reviewedRepoCount, 2);
  assert.equal(item(review, "links").count, 0);
  assert.equal(item(review, "readme").count, 0);
});

test("review is independent of popularity, account age, activity, and old benchmark overrides", () => {
  const input = source([
    repo("web", { readme: "# Web", rootFiles: ["vitest.config.mts"] }),
  ]);
  const before = buildEvidenceReview(input, "en");
  input.account.followers = 100000;
  input.account.publicRepoCount = 50000;
  input.activity.recentRepoCount = 1000;
  input.activity.lastActiveAt = "2000-01-01T00:00:00Z";
  input.representativeRepos[0].stars = 100000;
  input.representativeRepos[0].score = 100;
  process.env.GITHUBPRINT_BENCHMARK_OVERRIDE_PATH =
    "/not-a-reference-population.json";
  try {
    assert.deepEqual(buildEvidenceReview(input, "en"), before);
  } finally {
    delete process.env.GITHUBPRINT_BENCHMARK_OVERRIDE_PATH;
  }
});

test("diagnostics keep latest unique people across repeated requests and locales", async () => {
  const { summarizeSnapshots } = await import(
    "../scripts/aggregate-insights.mjs"
  );
  const record = (username, generatedAt, ids, locale = "en") => ({
    profile: { username },
    generatedAt,
    matchedSignalIds: ids,
    locale,
    benchmark: { sampleSize: 9999, overallPercentile: 99 },
  });
  const result = summarizeSnapshots([
    record("Alice", "2026-01-01", ["old"]),
    record("alice", "2026-02-01", ["new", "new"], "ko"),
    record("ALICE", "2026-01-20", ["old"]),
    record("Bob", "2026-01-01", ["new"]),
    null,
    record("bad", "invalid date", []),
  ]);
  assert.equal(result.uniqueProfileCount, 2);
  assert.equal(result.repeatedRecordCount, 2);
  assert.equal(result.invalidRecordCount, 2);
  assert.deepEqual(result.signals, [{ id: "new", profileCount: 2 }]);
  assert.equal("cohorts" in result, false);
  assert.equal("derivedBenchmarks" in result, false);
});

test("new captures contain rule diagnostics but no ranks or benchmark baselines", () => {
  const scoring = {
    matchedSignalIds: [],
    orientationScores: {},
    workingStyleScores: {},
    primaryOrientation: null,
    primaryWorkingStyle: null,
  };
  const snapshot = buildLearningSnapshot(source([]), scoring, "en");
  assert.equal(snapshot.schemaVersion, 2);
  assert.doesNotMatch(JSON.stringify(snapshot), rankingKeys);
});

for (const locale of ["ko", "en"]) {
  test(`empty review and missing artifacts render neutral, useful states (${locale})`, () => {
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const { EvidenceReviewBlock } = require("../components/result/common.tsx");
    const render = (repos) =>
      renderToStaticMarkup(
        React.createElement(EvidenceReviewBlock, {
          locale,
          evidenceReview: buildEvidenceReview(source(repos), locale),
        }),
      );
    const empty = render([]);
    assert.match(
      empty,
      locale === "ko"
        ? /검토할 공개 프로젝트를 찾지 못했습니다/
        : /No public projects were available/,
    );
    assert.doesNotMatch(empty, /data-document-group/);
    const partial = render([repo("partial")]);
    assert.match(
      partial,
      locale === "ko"
        ? /이번 조회 범위에서는 확인되지/
        : /Not observed in the fetched material/,
    );
    assert.match(partial, /Customize your pins/);
    assert.doesNotMatch(
      partial,
      /디렉터리를 찾았습니다|Fetched root paths include/,
    );
  });
}

test("diagnostic CLI retires stale distributions even when there are no records", () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { execFileSync } = require("node:child_process");
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), "githubprint-diagnostics-"),
  );
  try {
    const reports = path.join(temp, ".cache/githubprint/reports");
    fs.mkdirSync(reports, { recursive: true });
    const stale = path.join(reports, "derived-benchmarks.json");
    fs.writeFileSync(stale, "[]");
    execFileSync(
      process.execPath,
      [path.resolve("scripts/aggregate-insights.mjs")],
      { cwd: temp },
    );
    assert.equal(fs.existsSync(stale), false);
    const report = JSON.parse(
      fs.readFileSync(path.join(reports, "insights-summary.json")),
    );
    assert.equal(report.uniqueProfileCount, 0);
    assert.deepEqual(report.signals, []);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
