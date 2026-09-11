const test = require("node:test");
const assert = require("node:assert/strict");
process.env.NODE_ENV = "production";
process.env.GITHUB_CLIENT_ID = "synthetic-test-client";
process.env.GITHUB_CLIENT_SECRET = "synthetic-test-secret";
process.env.GITHUB_SESSION_SECRET = "synthetic-session-secret-only-for-tests";
process.env.OPENAI_API_KEY = "synthetic-key-private-must-never-use";
const fixture = require("./helpers/github-fixture.cjs");
globalThis.fetch = fixture.mockFetch;
const {
  getGitHubSource,
  getResumeRepoLookup,
  listPrivateRepositoryChoices,
} = require("../lib/github.ts");
const { analyzeGitHubSource } = require("../lib/analyze.ts");
require("../lib/internal-insights.ts").captureLearningSnapshot = async () => {
  throw new Error("Private analysis reached learning capture");
};
const { getResumeTemplateAvailability } = require("../lib/resume-source.ts");
const {
  defaultDocumentOptions,
  documentOptionsSchema,
  hasPrivateRepoPermission,
  needsPrivatePermission,
} = require("../lib/document-options.ts");
const {
  createDocumentConfiguration,
  resolveDocumentConfiguration,
} = require("../lib/document-configuration.ts");
const {
  createProtectedValue,
  buildGitHubAuthorizeUrl,
  createGitHubSessionValue,
  sanitizeRedirectPath,
} = require("../lib/auth.ts");
const { collectResumeOwnedRepoNames } = require("../lib/resume.ts");
const session = {
  accessToken: "synthetic-test-token",
  createdAt: new Date().toISOString(),
  scopes: ["read:user", "repo"],
  user: {
    login: fixture.username,
    name: "Privacy Fixture",
    avatarUrl: "",
    email: null,
    profileUrl: `https://github.com/${fixture.username}`,
  },
};
const auth = {
  accessToken: session.accessToken,
  scopes: session.scopes,
  viewerUsername: fixture.username,
};

test.beforeEach(() => fixture.reset());

test("ordinary OAuth login excludes private access; repo scope is an explicit upgrade", () => {
  assert.equal(
    new URL(buildGitHubAuthorizeUrl("state")).searchParams.get("scope"),
    "read:user",
  );
  assert.equal(
    new URL(buildGitHubAuthorizeUrl("state", "private")).searchParams.get(
      "scope",
    ),
    "read:user repo",
  );
  assert.equal(hasPrivateRepoPermission(["public_repo", "read:user"]), false);
  assert.equal(sanitizeRedirectPath("/\\evil.test"), "/");
});

test("configuration is encrypted, bound to the account and template, expires, and rechecks scope", () => {
  const options = {
    ...defaultDocumentOptions("profile"),
    analysisScope: "private-details",
    privateRepos: ["private-atlas"],
  };
  const token = createDocumentConfiguration(options, session);
  assert.ok(!token.includes("private-atlas"));
  assert.deepEqual(
    resolveDocumentConfiguration(token, "profile", session),
    options,
  );
  assert.throws(() => resolveDocumentConfiguration(token, "resume", session));
  assert.throws(() =>
    resolveDocumentConfiguration(token, "profile", {
      ...session,
      user: { ...session.user, login: "someone-else" },
    }),
  );
  assert.throws(() =>
    resolveDocumentConfiguration(token, "profile", {
      ...session,
      scopes: ["public_repo"],
    }),
  );
  assert.throws(() =>
    resolveDocumentConfiguration(token + "broken", "profile", session),
  );
  const expired = createProtectedValue({
    purpose: "document-configuration",
    username: fixture.username,
    expiresAt: Date.now() - 1,
    options,
  });
  assert.throws(() =>
    resolveDocumentConfiguration(expired, "profile", session),
  );
  assert.equal(
    resolveDocumentConfiguration(undefined, "resume", session).resumeSource,
    "public",
  );
});

test("template choices normalize unrelated fields and require bounded explicit selections", () => {
  assert.equal(
    needsPrivatePermission({
      ...defaultDocumentOptions("resume"),
      analysisScope: "private-details",
      privateRepos: ["old"],
    }),
    false,
  );
  const normalized = documentOptionsSchema.parse({
    ...defaultDocumentOptions("resume"),
    analysisScope: "private-details",
    privateRepos: ["old"],
  });
  assert.deepEqual(normalized.privateRepos, []);
  for (const names of [[], [".."], ["other/secret"], ["a", "b", "c", "d"]])
    assert.equal(
      documentOptionsSchema.safeParse({
        ...defaultDocumentOptions("profile"),
        analysisScope: "private-summary",
        privateRepos: names,
      }).success,
      false,
    );
});

test("a broad token does not trigger private reads in public mode", async () => {
  const source = await getGitHubSource(fixture.username, {
    authContext: auth,
    locale: "en",
  });
  assert.equal(source.dataMode, "public");
  assert.equal(source.authorizedPrivateInsights, null);
  assert.ok(!JSON.stringify(source).includes("SENTINEL"));
  assert.ok(
    fixture.calls.every(
      (call) =>
        !call.path.includes("private-atlas") &&
        call.path !== "/user/repos" &&
        !call.body?.includes("contributionsCollection"),
    ),
  );
  assert.ok(fixture.calls.every((call) => call.cache === "no-store"));
});

test("private access fails before network requests with public_repo-only scope", async () => {
  await assert.rejects(
    getGitHubSource(fixture.username, {
      authContext: { ...auth, scopes: ["public_repo"] },
      privateRepoNames: ["private-atlas"],
    }),
  );
  await assert.rejects(
    getResumeRepoLookup(fixture.username, {
      authContext: { ...auth, scopes: ["public_repo"] },
      allowPrivate: true,
    }),
  );
  assert.equal(fixture.calls.length, 0);
});

for (const locale of ["ko", "en"]) {
  test(`anonymous private analysis removes raw details before narrative, benchmark, and serialization (${locale})`, async () => {
    const source = await getGitHubSource(fixture.username, {
      authContext: auth,
      privateRepoNames: ["private-atlas"],
      privateExposureMode: "aggregate",
      locale,
    });
    const analysis = await analyzeGitHubSource(source, { locale });
    assert.equal(source.dataMode, "private_enriched");
    assert.equal(source.authorizedPrivateInsights.privateRepoCount, 1);
    assert.ok(
      source.authorizedPrivateInsights.topPrivateStack.includes("React"),
    );
    assert.deepEqual(source.authorizedPrivateInsights.privateShowcaseRepos, []);
    assert.doesNotMatch(
      JSON.stringify({ source, analysis }),
      /SENTINEL|private-atlas|unselected-vault/,
    );
    assert.equal(analysis.mode, "fallback");
    assert.ok(fixture.calls.every((call) => call.path !== "/user/repos"));
    assert.ok(
      fixture.calls.some(
        (call) =>
          call.path === `/repos/${fixture.username}/private-atlas/readme`,
      ),
    );
  });

  test(`private detail includes exactly selected projects while keeping benchmark public (${locale})`, async () => {
    const summary = await getGitHubSource(fixture.username, {
      authContext: auth,
      privateRepoNames: ["private-atlas"],
      privateExposureMode: "aggregate",
      locale,
    });
    const source = await getGitHubSource(fixture.username, {
      authContext: auth,
      privateRepoNames: ["private-atlas"],
      privateExposureMode: "include",
      locale,
    });
    const result = await analyzeGitHubSource(source, { locale });
    const summarized = await analyzeGitHubSource(summary, { locale });
    assert.deepEqual(result.benchmark, summarized.benchmark);
    assert.match(JSON.stringify(result.analysis.projects), /private-atlas/);
    assert.match(JSON.stringify(result.analysis.projects), /Private|비공개/);
    assert.doesNotMatch(
      JSON.stringify(result),
      /UNSELECTED_SENTINEL|unselected-vault/,
    );
    assert.equal(result.mode, "fallback");
  });
}

test("private picker loads only a names catalog, not repository content", async () => {
  const choices = await listPrivateRepositoryChoices(fixture.username, auth);
  assert.ok(choices.some((repo) => repo.name === "private-atlas"));
  assert.equal(fixture.calls.length, 1);
  assert.match(fixture.calls[0].query, /visibility=private/);
  assert.deepEqual(Object.keys(choices[0]).sort(), ["archived", "name"]);
});

for (const privateSource of [false, true])
  for (const allowPrivateSource of [false, true])
    for (const allowPrivateProjects of [false, true]) {
      test(`resume access matrix: stored private=${privateSource}, source=${allowPrivateSource}, projects=${allowPrivateProjects}`, async () => {
        fixture.setPrivateSource(privateSource);
        const availability = await getResumeTemplateAvailability({
          authContext: auth,
          username: fixture.username,
          locale: "en",
          allowPrivateSource,
          allowPrivateProjects,
          assetContext: "opaque-config",
        });
        assert.ok(fixture.calls.every((call) => call.path !== "/user/repos"));
        if (privateSource && !allowPrivateSource) {
          assert.equal(availability.state, "locked_missing_repo");
          assert.ok(
            fixture.calls.every((call) => !call.path.includes("/resume/")),
          );
          return;
        }
        assert.equal(availability.state, "ready", JSON.stringify(availability));
        assert.equal(
          availability.document.source.visibility,
          privateSource ? "private" : "public",
        );
        assert.equal(
          availability.document.source.assetContext,
          "opaque-config",
        );
        assert.equal(
          availability.document.basics.email,
          "authored@example.test",
        );
        const owned = availability.document.allProjects.find(
          (project) => project.repoSlug === `${fixture.username}/private-atlas`,
        );
        const other = availability.document.allProjects.find(
          (project) => project.repoSlug === "other/private-atlas",
        );
        assert.deepEqual(owned.bullets, ["AUTHORED_SENTINEL"]);
        assert.equal(
          owned.repoVisibility,
          allowPrivateProjects ? "private" : undefined,
        );
        assert.equal(
          owned.repoDescription,
          allowPrivateProjects
            ? "PRIVATE_DESCRIPTION_SENTINEL internal dashboard"
            : undefined,
        );
        assert.equal(other.repoDescription, undefined);
        assert.equal(other.repoVerified, false);
        assert.equal(other.repoUrl, "https://github.com/other/private-atlas");
        assert.equal(
          availability.document.source.linkedPrivateRepoCount,
          allowPrivateProjects ? 1 : 0,
        );
        assert.equal(
          fixture.calls.some((call) => call.path.endsWith("/private-atlas")),
          allowPrivateProjects,
        );
        assert.ok(
          fixture.calls.every((call) => !call.path.includes("/private-atlas/")),
        );
      });
    }

test("resume repo references are owner-qualified and path-safe", () => {
  assert.deepEqual(
    collectResumeOwnedRepoNames(
      {
        projects: [
          { repo: "own" },
          { repo: `${fixture.username}/other` },
          { repo: "outsider/secret" },
          { repo: "../../secret" },
          { repo: `https://github.com/${fixture.username}/repo.git` },
        ],
        summary: { repo: "not-an-access-instruction" },
      },
      fixture.username,
    ),
    ["own", "other", "repo"],
  );
});

test("private assets and legacy DOCX enforce configuration at their entry points", async () => {
  const nextHeaders = require("next/headers");
  nextHeaders.cookies = async () => ({
    get: () => ({ value: createGitHubSessionValue(session) }),
  });
  const { NextRequest } = require("next/server");
  const assets = require("../app/api/resume-asset/route.ts");
  assert.equal(
    (
      await assets.GET(
        new NextRequest(
          "http://localhost/api/resume-asset?path=assets/avatar.png",
        ),
      )
    ).status,
    404,
  );
  const options = {
    ...defaultDocumentOptions("resume"),
    resumeSource: "authorized",
  };
  const config = createDocumentConfiguration(options, session);
  const response = await assets.GET(
    new NextRequest(
      `http://localhost/api/resume-asset?path=assets/avatar.png&config=${config}`,
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(
    (
      await assets.GET(
        new NextRequest(
          "http://localhost/api/resume-asset?path=assets/avatar.png&config=invalid",
        ),
      )
    ).status,
    403,
  );
  const docx = require("../app/api/resume-docx/route.ts");
  assert.equal(
    (
      await docx.GET(
        new NextRequest("http://localhost/api/resume-docx?lang=en"),
      )
    ).status,
    409,
  );
});

test("configuration endpoint enforces sign-in, same origin, validation, and encrypted selection", async () => {
  const nextHeaders = require("next/headers");
  const { NextRequest } = require("next/server");
  const route = require("../app/api/document-configuration/route.ts");
  nextHeaders.cookies = async () => ({
    get: () => ({ value: createGitHubSessionValue(session) }),
  });
  const request = (origin, options) =>
    new NextRequest("http://localhost/api/document-configuration", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ options, locale: "en" }),
    });
  const options = {
    ...defaultDocumentOptions("profile"),
    analysisScope: "private-details",
    privateRepos: ["private-atlas"],
  };
  assert.equal(
    (await route.POST(request("https://other.test", options))).status,
    403,
  );
  assert.equal(
    (
      await route.POST(
        request("http://localhost", { ...options, privateRepos: [] }),
      )
    ).status,
    400,
  );
  const response = await route.POST(request("http://localhost", options));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const { url } = await response.json();
  assert.doesNotMatch(url, /private-atlas/);
  assert.deepEqual(
    resolveDocumentConfiguration(
      new URL(url, "http://localhost").searchParams.get("config"),
      "profile",
      session,
    ),
    options,
  );
  nextHeaders.cookies = async () => ({
    get: () => ({
      value: createGitHubSessionValue({ ...session, scopes: ["public_repo"] }),
    }),
  });
  assert.equal(
    (await route.POST(request("http://localhost", options))).status,
    403,
  );
  nextHeaders.cookies = async () => ({ get: () => undefined });
  assert.equal(
    (await route.POST(request("http://localhost", options))).status,
    401,
  );
});

test("declining an optional OAuth upgrade preserves the existing session", async () => {
  const { createGitHubAuthStateValue } = require("../lib/auth.ts");
  const { NextRequest } = require("next/server");
  const callback = require("../app/api/auth/github/callback/route.ts");
  const state = createGitHubAuthStateValue({
    redirectTo: "/en/#generator",
    state: "synthetic-state",
    access: "private",
  });
  const response = await callback.GET(
    new NextRequest(
      "http://localhost/api/auth/github/callback?error=access_denied",
      { headers: { cookie: `githubprint-github-oauth-state=${state}` } },
    ),
  );
  assert.equal(
    response.headers.get("location"),
    "http://localhost/en/#generator",
  );
  assert.ok(!response.cookies.get("githubprint-github-session"));
});
