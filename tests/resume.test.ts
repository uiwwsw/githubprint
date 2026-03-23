import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResumeProjectEvidenceSummary,
  buildResumeDocument,
  collectResumeMarkdownPaths,
  parseResumeYamlDocument,
} from "../lib/resume";

test("parses valid resume.yaml and collects markdown references", () => {
  const source = `
basics:
  name: "Jane Doe"
summary:
  markdown:
    ko: "content/summary.ko.md"
    en: "content/summary.en.md"
experience:
  - title: "GitHubPrint"
    detailsMarkdown:
      markdown: "content/experience/githubprint.md"
`;

  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.deepEqual(collectResumeMarkdownPaths(parsed.data), [
    "content/summary.ko.md",
    "content/summary.en.md",
    "content/experience/githubprint.md",
  ]);
});

test("normalizes resume content and verifies owned project repositories", () => {
  const source = `
basics:
  name:
    ko: "홍길동"
    en: "Hong Gil Dong"
  avatar: "assets/profile.jpg"
summary:
  markdown:
    ko: "content/summary.ko.md"
projects:
  - title:
      ko: "GitHubPrint"
      en: "GitHubPrint"
    id: "githubprint-product"
    repo: "githubprint"
    start: "2025-02-01"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript"]
featuredProjects:
  - "githubprint-product"
experience:
  - title:
      ko: "Acme"
      en: "Acme"
    start: "2024-01-01"
    current: true
skills:
  - title:
      ko: "Core"
      en: "Core"
    items: ["TypeScript", "React"]
`;
  const parsed = parseResumeYamlDocument(source);
  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  const document = buildResumeDocument(parsed.data, {
    contentFiles: {
      "content/summary.ko.md": "제품과 구현을 함께 다룹니다.",
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
  - school:
      ko: "공주대학교"
      en: "Kongju National University"
    degree:
      ko: "건축학전공"
      en: "Architecture"
    status:
      ko: "졸업"
      en: "Graduated"
    start: "2006-02-01"
    end: "2014-01-01"
customSections:
  - title:
      ko: "교육"
      en: "Training"
    items:
      - title:
          ko: "함수형프로그래밍"
          en: "Functional Programming"
        date: "2020-06-01"
        organization:
          ko: "프로그래머스"
          en: "Programmers"
        note:
          ko: "언어: JavaScript"
          en: "Language: JavaScript"
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
