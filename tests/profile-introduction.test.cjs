const test = require("node:test");
const assert = require("node:assert/strict");
const { buildProfileIntroduction } = require("../lib/profile-introduction.ts");
const { buildRuleBasedAnalysis } = require("../lib/narrative-writer.ts");
const { extractProfileFeatures } = require("../lib/profile-features.ts");
const { scoreProfile } = require("../lib/rule-engine.ts");
const { profileEngineConfig } = require("../lib/data-loader.ts");
const { regressionCases } = require("../fixtures/regression-cases.ts");

const base = regressionCases[0].source;
function sourceWith(repos) {
  return {
    ...base,
    repos,
    representativeRepos: repos,
    signalRepos: repos,
    pinnedRepoNames: [],
    activity: { ...base.activity, recentRepoCount: 0 },
    account: { ...base.account, publicRepoCount: repos.length },
  };
}
function repo(name, overrides = {}) {
  return {
    ...base.repos[0],
    name,
    repoUrl: `https://github.com/example/${name}`,
    language: null,
    description: null,
    readme: null,
    techSignals: [],
    topics: [],
    rootFiles: [],
    homepageUrl: "",
    isPinned: false,
    isFork: false,
    manifestContents: [],
    identity: undefined,
    stars: 0,
    score: 0,
    ...overrides,
  };
}
function introduce(source, locale = "ko") {
  const scoring = scoreProfile(
    source,
    extractProfileFeatures(source, profileEngineConfig),
    profileEngineConfig,
    locale,
  );
  return buildProfileIntroduction(source, scoring, locale);
}

test("the introduction names real projects and their technologies for every regression profile", () => {
  for (const { source } of regressionCases)
    for (const locale of ["ko", "en"]) {
      const result = introduce(source, locale);
      assert.ok(
        source.repos.some((repo) => result.summary.includes(repo.name)),
      );
      assert.doesNotMatch(
        result.headline + result.summary + result.workingStyle,
        /전문가|시니어|탁월|빠르게|성격|senior|expert|fast[- ]moving|exceptional/i,
      );
      const scoring = scoreProfile(
        source,
        extractProfileFeatures(source, profileEngineConfig),
        profileEngineConfig,
        locale,
      );
      assert.doesNotThrow(() =>
        buildRuleBasedAnalysis(source, scoring, profileEngineConfig, locale),
      );
    }
});
test("a single richly tagged project does not become a recurring specialty", () => {
  const source = sourceWith([
    repo("single-app", {
      topics: ["react", "nextjs", "frontend"],
      rootFiles: ["next.config.ts", ".storybook"],
      techSignals: ["React", "Next.js"],
    }),
  ]);
  const result = introduce(source);
  assert.equal(result.headline, "프로젝트로 보는 개발 기록");
  assert.match(result.summary, /single-app/);
  assert.doesNotMatch(result.developerType, /반복됩니다|전문 개발자/);
});
test("two distinct matching projects justify a developer introduction with named support", () => {
  const source = sourceWith(
    ["storefront", "component-kit"].map((name) =>
      repo(name, {
        topics: ["react", "frontend"],
        rootFiles: ["next.config.ts"],
        techSignals: ["React"],
      }),
    ),
  );
  const result = introduce(source);
  assert.equal(result.headline, "웹 인터페이스를 만드는 개발자");
  assert.match(result.summary, /storefront/);
  assert.match(result.summary, /component-kit/);
  assert.match(result.summary, /React/);
  assert.match(result.developerType, /서로 다른 저장소/);
});
test("duplicate repositories, forks and popularity cannot establish a specialty or personality", () => {
  const original = repo("popular", {
    stars: 50000,
    topics: ["react", "nextjs"],
    rootFiles: ["next.config.ts"],
    homepageUrl: "https://example.com",
    readme: "notes",
  });
  const result = introduce(
    sourceWith([
      original,
      { ...original },
      repo("fork", {
        ...original,
        name: "fork",
        repoUrl: "https://github.com/example/fork",
        isFork: true,
      }),
    ]),
  );
  assert.equal(result.headline, "프로젝트로 보는 개발 기록");
  assert.doesNotMatch(
    result.workingStyle,
    /시제품|프로토타입|속도|탁월|품질|반복/,
  );
});
test("an empty .github directory or a testing keyword cannot imply test setup", () => {
  const source = sourceWith([
    repo("descriptive", {
      readme: "Testing is important",
      rootFiles: [".github"],
      topics: ["testing"],
    }),
  ]);
  assert.doesNotMatch(introduce(source).workingStyle, /테스트·검증 설정/);
  source.repos[0].rootFiles.push("vitest.config.ts");
  assert.match(
    introduce(source).summary,
    /테스트·검증 설정/,
  );
});
test("private names and technologies remain outside anonymous introductions", () => {
  const secret = repo("internal-client-secret", {
    visibility: "private",
    topics: ["react", "frontend"],
    rootFiles: ["next.config.ts"],
    techSignals: ["SecretFramework"],
    readme: "client strategy",
    homepageUrl: "https://secret.example.com",
  });
  const source = {
    ...sourceWith([repo("public-example"), secret]),
    dataMode: "private_enriched",
    privateExposureMode: "aggregate",
  };
  const result = JSON.stringify(introduce(source));
  assert.doesNotMatch(
    result,
    /internal-client-secret|SecretFramework|client strategy|secret.example/,
  );
});
test("empty evidence does not invent a generalist or a main technology", () => {
  for (const locale of ["ko", "en"]) {
    const source = sourceWith([]),
      result = introduce(source, locale);
    assert.doesNotMatch(
      result.summary,
      /여러 분야|여러 기술|generalist|multiple technologies/i,
    );
    assert.ok(result.strengths.length >= 2);
  }
});
test("topic labels alone do not become implemented expertise", () => {
  const source = sourceWith(
    ["labels-one", "labels-two"].map((name) =>
      repo(name, { topics: ["react", "nextjs", "frontend"] }),
    ),
  );
  assert.equal(introduce(source).headline, "프로젝트로 보는 개발 기록");
});
test("even a valid AI response cannot replace grounded facts with unsupported personal claims", async (t) => {
  const { Responses } = require("openai/resources/responses/responses");
  const { analyzeGitHubSource } = require("../lib/analyze.ts");
  t.mock.method(
    require("../lib/internal-insights.ts"),
    "captureLearningSnapshot",
    async () => {},
  );
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-never-sent";
  t.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  const source = sourceWith(
    ["ui-one", "ui-two"].map((name) =>
      repo(name, {
        topics: ["react"],
        rootFiles: ["next.config.ts"],
        techSignals: ["React"],
      }),
    ),
  );
  const scoring = scoreProfile(
    source,
    extractProfileFeatures(source, profileEngineConfig),
    profileEngineConfig,
    "ko",
  );
  const expected = buildRuleBasedAnalysis(
    source,
    scoring,
    profileEngineConfig,
    "ko",
  );
  const fictional = structuredClone(expected);
  fictional.profile.headline = "10년 경력의 탁월한 시니어";
  fictional.profile.summary = "빠른 개발 속도와 리더십으로 매출 2배 달성";
  fictional.inferred.workingStyle = "완벽주의자";
  fictional.facts.followers = 999999;
  let called = false;
  t.mock.method(Responses.prototype, "parse", async (request) => {
    called = true;
    assert.match(JSON.stringify(request.input), /groundedIntroduction/);
    return { output_parsed: fictional };
  });
  const result = await analyzeGitHubSource(source, {
    forceFresh: true,
    locale: "ko",
  });
  assert.equal(called, true);
  assert.equal(result.mode, "openai");
  assert.deepEqual(result.analysis.profile, expected.profile);
  assert.deepEqual(result.analysis.inferred, expected.inferred);
  assert.deepEqual(result.analysis.facts, expected.facts);
});
test("single-project English descriptions use singular verbs and keep the project identifiable", () => {
  const source = sourceWith([
    repo("one-app", {
      rootFiles: ["vitest.config.ts"],
      homepageUrl: "https://example.com",
    }),
  ]);
  const result = introduce(source, "en");
  assert.match(result.summary, /one-app offers/);
  assert.match(result.summary, /This project includes/);
  assert.match(result.workingStyle, /one-app provides/);
});
