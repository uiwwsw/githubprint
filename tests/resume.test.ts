import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResumeProjectEvidenceSummary,
  buildResumeDocument,
  collectResumeMarkdownPaths,
  parseResumeYamlDocument,
  pickResumeManifestFile,
} from "../lib/resume";

test("prefers locale-specific manifests and falls back to resume.yaml", () => {
  assert.equal(
    pickResumeManifestFile(["resume.yaml", "resume.en.yaml"], "en"),
    "resume.en.yaml",
  );
  assert.equal(
    pickResumeManifestFile(["resume.yaml", "resume_en.yaml"], "en"),
    "resume_en.yaml",
  );
  assert.equal(pickResumeManifestFile(["resume.yaml"], "en"), "resume.yaml");
  assert.equal(pickResumeManifestFile(["resume.yaml"], "ko"), "resume.yaml");
});

test("parses valid single-locale resume.yaml and collects markdown references", () => {
  const source = `
basics:
  name: "Jane Doe"
summary:
  markdown: "content/ko/summary.md"
experience:
  - title: "GitHubPrint"
    detailsMarkdown:
      markdown: "content/ko/experience/githubprint.md"
`;

  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.deepEqual(collectResumeMarkdownPaths(parsed.data), [
    "content/ko/summary.md",
    "content/ko/experience/githubprint.md",
  ]);
});

test("warns when legacy single-file ko/en localized fields are used", () => {
  const parsed = parseResumeYamlDocument(`
basics:
  name:
    ko: "홍길동"
    en: "Hong Gil Dong"
summary:
  markdown:
    ko: "content/summary.ko.md"
    en: "content/summary.en.md"
`);

  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.match(parsed.warnings.join("\n"), /legacy/i);
  assert.match(parsed.warnings.join("\n"), /resume\.en\.yaml/i);
});

test("normalizes resume content and verifies owned project repositories", () => {
  const source = `
basics:
  name: "홍길동"
  avatar: "assets/profile.jpg"
summary:
  markdown: "content/ko/summary.md"
projects:
  - title: "GitHubPrint"
    id: "githubprint-product"
    repo: "githubprint"
    start: "2025-02-01"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript"]
featuredProjects:
  - "githubprint-product"
experience:
  - title: "Acme"
    start: "2024-01-01"
    current: true
skills:
  - title: "Core"
    items: ["TypeScript", "React"]
`;
  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {
      "content/ko/summary.md": "제품과 구현을 함께 다룹니다.",
    },
    locale: "ko",
    repoCatalog: [
      {
        createdAt: "2025-02-01T00:00:00.000Z",
        description: "Turns GitHub into a shareable document",
        homepageUrl: "https://githubprint.vercel.app",
        language: "TypeScript",
        name: "githubprint",
        projectLabels: ["AI", "frontend"],
        pushedAt: "2026-03-01T00:00:00.000Z",
        repoUrl: "https://github.com/example/githubprint",
        topics: ["ai", "nextjs"],
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ],
    repoUrl: "https://github.com/example/resume",
    updatedAt: "2026-03-23T00:00:00.000Z",
    username: "example",
    visibility: "public",
  });

  assert.equal(document.basics.name, "홍길동");
  assert.equal(document.basics.avatarPath, "assets/profile.jpg");
  assert.equal(document.summary, "제품과 구현을 함께 다룹니다.");
  assert.equal(document.allProjects[0]?.id, "githubprint-product");
  assert.equal(document.projects[0]?.repoVerified, true);
  assert.equal(
    document.projects[0]?.repoUrl,
    "https://github.com/example/githubprint",
  );
  assert.equal(
    document.projects[0]?.repoDescription,
    "Turns GitHub into a shareable document",
  );
  assert.deepEqual(document.projects[0]?.projectLabels, ["AI", "frontend"]);
  assert.equal(document.projects[0]?.linkedExperienceTitle, "Acme");
  assert.equal(document.projects[0]?.sortDate, "2025-02-01");
  assert.equal(
    document.projects[0]?.subtitle,
    "Turns GitHub into a shareable document",
  );
  assert.equal(
    buildResumeProjectEvidenceSummary(document.projects[0]!, "ko"),
    "GitHub 기준으로는 AI와 프론트엔드 성격이 보입니다. Next.js와 TypeScript 중심으로 확인됩니다. 서비스 링크와 검증된 GitHub 저장소가 함께 연결되어 있습니다.",
  );
  assert.deepEqual(document.skills[0], {
    items: ["TypeScript", "React"],
    title: "Core",
  });
});

test("supports featured project selection and repo-backed project synthesis", () => {
  const source = `
basics:
  name: "Jane Doe"
experience:
  - title: "Semits"
    start: "2023-08-01"
    end: "2024-04-01"
projects:
  - id: "semits-internal"
    title: "Equipment Client"
    subtitle: "Internal project"
    start: "2023-09-01"
    end: "2024-03-01"
    tech: ["React", "TypeScript"]
featuredProjects:
  - project: "semits-internal"
  - repo: "githubprint"
`;

  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {},
    locale: "en",
    repoCatalog: [
      {
        createdAt: "2025-02-01T00:00:00.000Z",
        description: "Turns GitHub into a shareable document",
        homepageUrl: "https://githubprint.vercel.app",
        language: "TypeScript",
        name: "githubprint",
        projectLabels: ["AI", "frontend"],
        pushedAt: "2026-03-01T00:00:00.000Z",
        repoUrl: "https://github.com/example/githubprint",
        topics: ["ai", "nextjs"],
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ],
    repoUrl: "https://github.com/example/resume",
    updatedAt: "2026-03-23T00:00:00.000Z",
    username: "example",
    visibility: "public",
  });

  assert.equal(document.allProjects.length, 1);
  assert.equal(document.allProjects[0]?.linkedExperienceTitle, "Semits");
  assert.equal(document.projects.length, 2);
  assert.deepEqual(
    document.projects.map((project) => project.title),
    ["githubprint", "Equipment Client"],
  );
  assert.equal(
    document.projects[0]?.liveUrl,
    "https://githubprint.vercel.app",
  );
  assert.equal(
    document.projects[0]?.repoDescription,
    "Turns GitHub into a shareable document",
  );
  assert.deepEqual(document.projects[0]?.projectLabels, ["AI", "frontend"]);
  assert.deepEqual(document.projects[0]?.tech, ["TypeScript"]);
  assert.equal(
    buildResumeProjectEvidenceSummary(document.projects[0]!, "en"),
    "Based on the GitHub evidence, this reads most clearly as AI and Frontend work. The clearest stack centers on TypeScript. It includes both a live link and a verified GitHub repository.",
  );
});

test("accepts resume repo education and custom section shapes", () => {
  const source = `
basics:
  name: "Jane Doe"
education:
  - school: "공주대학교"
    degree: "건축학전공"
    status: "졸업"
    start: "2006-02-01"
    end: "2014-01-01"
customSections:
  - title: "교육"
    items:
      - title: "함수형프로그래밍"
        date: "2020-06-01"
        organization: "프로그래머스"
        note: "언어: JavaScript"
projects: []
skills: []
`;

  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {},
    locale: "ko",
    repoCatalog: [],
    repoUrl: "https://github.com/example/resume",
    username: "example",
    visibility: "public",
  });

  assert.equal(document.education[0]?.title, "공주대학교");
  assert.equal(document.education[0]?.subtitle, "건축학전공 · 졸업");
  assert.equal(document.customSections[0]?.id, "custom-section-1");
  assert.equal(document.customSections[0]?.items[0]?.title, "함수형프로그래밍");
  assert.equal(document.customSections[0]?.items[0]?.subtitle, "프로그래머스");
  assert.deepEqual(document.customSections[0]?.items[0]?.bullets, ["언어: JavaScript"]);
});

test("rejects invalid resume.yaml schema", () => {
  const parsed = parseResumeYamlDocument(`
summary: "missing basics"
`);

  assert.equal(parsed.success, false);

  if (parsed.success) {
    return;
  }

  assert.match(parsed.error, /Invalid input|basics|expected/i);
});

test("keeps valid resume sections when unrelated yaml entries are broken", () => {
  const parsed = parseResumeYamlDocument(`
basics:
  name: "Jane Doe"
  website: "not-a-url"
summary:
  markdown: "content/summary.md"
experience:
  - subtitle: "Missing title should be skipped"
  - title: "Stable Experience"
    detailsMarkdown:
      markdown: "content/notes.txt"
projects:
  - title: "Stable Project"
    repo: "githubprint"
    liveUrl: "notaurl"
featuredProjects:
  - "missing-project"
`);

  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.equal(parsed.data.experience?.length, 1);
  assert.equal(parsed.data.projects?.length, 1);
  assert.match(parsed.warnings.join("\n"), /basics\.website/);
  assert.match(parsed.warnings.join("\n"), /experience\[0\]\.title/);
  assert.match(parsed.warnings.join("\n"), /experience\[1\]\.detailsMarkdown/);
  assert.match(parsed.warnings.join("\n"), /projects\[0\]\.liveUrl/);

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {},
    locale: "en",
    parseWarnings: parsed.warnings,
    repoCatalog: [
      {
        createdAt: "2025-02-01T00:00:00.000Z",
        description: "Turns GitHub into a shareable document",
        homepageUrl: "https://githubprint.vercel.app",
        language: "TypeScript",
        name: "githubprint",
        projectLabels: ["AI", "frontend"],
        pushedAt: "2026-03-01T00:00:00.000Z",
        repoUrl: "https://github.com/example/githubprint",
        topics: ["ai", "nextjs"],
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ],
    repoUrl: "https://github.com/example/resume",
    username: "example",
    visibility: "public",
  });

  assert.equal(document.basics.website, undefined);
  assert.equal(document.summary, undefined);
  assert.equal(document.experience.length, 1);
  assert.equal(document.experience[0]?.title, "Stable Experience");
  assert.equal(document.experience[0]?.detailsMarkdown, undefined);
  assert.equal(document.allProjects.length, 1);
  assert.equal(document.allProjects[0]?.title, "Stable Project");
  assert.equal(document.allProjects[0]?.liveUrl, undefined);
  assert.equal(document.projects.length, 1);
  assert.equal(document.projects[0]?.title, "Stable Project");
  assert.match(document.warnings.join("\n"), /Missing referenced Markdown file: content\/summary\.md/);
  assert.match(document.warnings.join("\n"), /featuredProjects\[0\]/);
});

test("accepts empty referenced markdown files without treating them as missing", () => {
  const parsed = parseResumeYamlDocument(`
basics:
  name: "Jane Doe"
experience:
  - title: "Example"
    detailsMarkdown:
      markdown: "content/experience/example.md"
`);

  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {
      "content/experience/example.md": "",
    },
    locale: "en",
    repoCatalog: [],
    repoUrl: "https://github.com/example/resume",
    username: "example",
    visibility: "public",
  });

  assert.equal(document.experience[0]?.title, "Example");
  assert.equal(document.experience[0]?.detailsMarkdown, undefined);
});
