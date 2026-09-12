const test = require("node:test");
const assert = require("node:assert/strict");

test("missing resume offers inline recovery without opting into private access", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const {
    AppRouterContext,
  } = require("next/dist/shared/lib/app-router-context.shared-runtime");
  const {
    ResumeResultState,
  } = require("../components/result/resume-result-state.tsx");
  for (const locale of ["ko", "en"]) {
    for (const canReadPrivate of [false, true]) {
      for (const resumeSource of ["public", "authorized"]) {
        const html = renderToStaticMarkup(
          React.createElement(
            AppRouterContext.Provider,
            { value: { push() {} } },
            React.createElement(ResumeResultState, {
              availability: { state: "locked_missing_repo" },
              locale,
              recovery: {
                username: "privacy-fixture",
                canReadPrivate,
                loginHref: "/api/auth/github/login?access=public",
                privateLoginHref: "/api/auth/github/login?access=private",
                initialOptions: {
                  ...defaultDocumentOptions("resume"),
                  resumeSource,
                },
              },
            }),
          ),
        );
        assert.match(
          html,
          locale === "ko" ? /이력서 다시 불러오기/ : /Load resume again/,
        );
        assert.doesNotMatch(
          html,
          /aria-label="(?:문서 템플릿|Document template)"/,
        );
        const sourceInputs = html.match(
          /<input[^>]*name="resume-source"[^>]*>/g,
        );
        assert.equal(sourceInputs.length, 2);
        assert.equal(
          sourceInputs[0].includes('checked=""'),
          resumeSource === "public",
        );
        assert.equal(
          sourceInputs[1].includes('checked=""'),
          resumeSource === "authorized",
        );
        assert.equal(
          html.includes('href="/api/auth/github/login?access=private"'),
          resumeSource === "authorized" && !canReadPrivate,
        );
        // Generation stays disabled until the selected source has been checked in the browser.
        assert.equal(/<button[^>]*disabled=""[^>]*>/.test(html), true);
      }
    }
  }
});
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

test.beforeEach(() => {
  fixture.reset();
  globalThis.fetch = fixture.mockFetch;
});

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
  test(`anonymous private analysis removes raw details before narrative, evidenceReview, and serialization (${locale})`, async () => {
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

  test(`private detail includes exactly selected projects while keeping evidenceReview public (${locale})`, async () => {
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
    assert.deepEqual(result.evidenceReview, summarized.evidenceReview);
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
    "http://localhost/en/?github_auth=cancelled#generator",
  );
  assert.ok(!response.cookies.get("githubprint-github-session"));
});

const { checkResumeReadiness } = require("../lib/resume-readiness.ts");
test("resume readiness verifies only the selected source, without disclosing authored content or reading private links", async () => {
  assert.equal(
    (await checkResumeReadiness(session, "public", "ko")).state,
    "missing_repo",
  );
  assert.ok(
    !fixture.calls.some((call) =>
      call.path.startsWith("/repos/privacy-fixture/resume"),
    ),
  );
  fixture.reset();
  const ready = await checkResumeReadiness(session, "authorized", "en");
  assert.deepEqual(ready, { state: "ready", repoVisibility: "private" });
  assert.doesNotMatch(JSON.stringify(ready), /SENTINEL|token|authored@example/);
  assert.ok(
    fixture.calls.every(
      (call) =>
        !call.path.includes("private-atlas") && call.path !== "/user/repos",
    ),
  );
  fixture.reset();
  assert.equal(
    (
      await checkResumeReadiness(
        { ...session, scopes: ["read:user"] },
        "authorized",
        "ko",
      )
    ).state,
    "permission",
  );
  assert.equal(fixture.calls.length, 0);
});

test("resume.yaml remains discoverable after the first 24 root entries", async () => {
  globalThis.fetch = async (input, init) => {
    if (new URL(input).pathname === "/repos/privacy-fixture/resume/contents")
      return Response.json([
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `file-${i}.md`,
          type: "file",
        })),
        { name: "resume.yaml", type: "file" },
      ]);
    return fixture.mockFetch(input, init);
  };
  assert.equal(
    (await checkResumeReadiness(session, "authorized", "ko")).state,
    "ready",
  );
});

for (const suffix of [
  "contents",
  "contents/resume.yaml",
  "contents/content/summary.md",
]) {
  for (const [status, state] of [
    [401, "authentication"],
    [403, "permission"],
    [429, "rate_limited"],
    [503, "unavailable"],
  ]) {
    test(`resume ${suffix} HTTP ${status} is reported as ${state}, never a missing YAML file`, async () => {
      globalThis.fetch = async (input, init) =>
        new URL(input).pathname === `/repos/privacy-fixture/resume/${suffix}`
          ? Response.json({ message: "unavailable" }, { status })
          : fixture.mockFetch(input, init);
      assert.equal(
        (await checkResumeReadiness(session, "authorized", "ko")).state,
        state,
      );
    });
  }
}

test("readiness route requires the same origin and authenticated explicit source selection", async () => {
  const nextHeaders = require("next/headers");
  const { NextRequest } = require("next/server");
  const route = require("../app/api/resume-readiness/route.ts");
  const request = (origin, source = "authorized") =>
    new NextRequest("http://localhost/api/resume-readiness", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ source, locale: "ko" }),
    });
  nextHeaders.cookies = async () => ({ get: () => undefined });
  assert.equal((await route.POST(request("http://localhost"))).status, 401);
  nextHeaders.cookies = async () => ({
    get: () => ({ value: createGitHubSessionValue(session) }),
  });
  assert.equal((await route.POST(request("https://other.test"))).status, 403);
  assert.equal(
    (await route.POST(request("http://localhost", "all"))).status,
    400,
  );
  const result = await route.POST(request("http://localhost"));
  assert.equal(result.headers.get("cache-control"), "private, no-store");
  assert.equal((await result.json()).state, "ready");
});

test("OAuth uses token-verified scopes and reports a completed or incomplete permission upgrade", async () => {
  const {
    createGitHubAuthStateValue,
    readGitHubAuthState,
  } = require("../lib/auth.ts");
  const { NextRequest } = require("next/server");
  const callback = require("../app/api/auth/github/callback/route.ts");
  const cookie = createGitHubAuthStateValue({
    redirectTo: "/en/#generator",
    state: "test-state",
    access: "private",
  });
  for (const scopes of ["read:user,repo", "read:user"]) {
    globalThis.fetch = async (input) =>
      String(input).includes("access_token")
        ? Response.json({ access_token: "synthetic-new-token", scope: "" })
        : Response.json(
            {
              login: fixture.username,
              name: "Fixture",
              avatar_url: "",
              html_url: "https://github.com/privacy-fixture",
            },
            { headers: { "x-oauth-scopes": scopes } },
          );
    const response = await callback.GET(
      new NextRequest(
        "http://localhost/api/auth/github/callback?code=code&state=test-state",
        { headers: { cookie: `githubprint-github-oauth-state=${cookie}` } },
      ),
    );
    assert.equal(
      new URL(response.headers.get("location")).searchParams.get("github_auth"),
      scopes.includes("repo") ? "connected" : "permission",
    );
    assert.ok(response.cookies.get("githubprint-github-session"));
  }
  globalThis.fetch = async () => {
    throw new Error("unavailable");
  };
  const response = await callback.GET(
    new NextRequest(
      "http://localhost/api/auth/github/callback?code=code&state=test-state",
      { headers: { cookie: `githubprint-github-oauth-state=${cookie}` } },
    ),
  );
  assert.equal(
    new URL(response.headers.get("location")).searchParams.get("github_auth"),
    "failed",
  );
  assert.ok(!response.cookies.get("githubprint-github-session"));
});

test("a dropped Markdown request remains a network failure instead of invalid YAML", async () => {
  globalThis.fetch = async (input, init) => {
    if (
      new URL(input).pathname ===
      "/repos/privacy-fixture/resume/contents/content/summary.md"
    )
      throw new TypeError("fetch failed");
    return fixture.mockFetch(input, init);
  };
  assert.equal(
    (await checkResumeReadiness(session, "authorized", "ko")).state,
    "unavailable",
  );
});
