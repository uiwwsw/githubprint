import test from "node:test";
import assert from "node:assert/strict";
import type { ResumeDocumentData, ResumeProject } from "../lib/resume";
import { buildShowcaseStructuredData } from "../lib/seo";
import {
  getShowcaseSeoDescription,
  getShowcaseSeoTitle,
} from "../lib/showcase";
import { buildPublicShowcaseResumeDocument } from "../lib/showcase-resume-mask";

function buildProject(overrides: Partial<ResumeProject> = {}): ResumeProject {
  return {
    bullets: ["PUBLIC_PROJECT_DETAIL"],
    current: false,
    links: [
      {
        kind: "repo",
        label: "GitHub",
        url: "https://github.com/uiwwsw/public-project",
      },
    ],
    projectLabels: ["Web application"],
    repoVerified: true,
    tech: ["TypeScript"],
    title: "Public project",
    ...overrides,
  };
}

function buildDocument(): ResumeDocumentData {
  const project = buildProject({
    linkedExperienceTitle: "SECRET_COMPANY",
  });

  return {
    basics: {
      avatarPath: "assets/profile.png",
      email: "secret@example.com",
      headline: "Public headline",
      links: [
        {
          kind: "contact",
          label: "Email",
          url: "mailto:secret@example.com",
        },
        {
          kind: "live",
          label: "Portfolio",
          url: "https://example.com",
        },
      ],
      location: "SECRET_LOCATION",
      name: "Public name",
      phone: "SECRET_PHONE",
      website: "https://example.com",
    },
    customSections: [
      {
        id: "public-highlights",
        items: [
          {
            bullets: ["PUBLIC_HIGHLIGHT"],
            current: false,
            links: [],
            title: "Public highlight",
          },
        ],
        layout: "list",
        title: "Highlights",
      },
    ],
    education: [
      {
        bullets: ["PUBLIC_EDUCATION"],
        current: false,
        links: [],
        title: "Public education",
      },
    ],
    experience: [
      {
        bullets: ["SECRET_ROLE_DETAIL"],
        current: true,
        detailsMarkdown: "SECRET_EXPERIENCE_MARKDOWN",
        links: [
          {
            kind: "other",
            label: "Company",
            url: "https://secret.example.com",
          },
        ],
        location: "SECRET_OFFICE",
        start: "2024-01",
        subtitle: "SECRET_ROLE",
        title: "SECRET_COMPANY",
      },
      {
        bullets: ["ANOTHER_SECRET_ROLE_DETAIL"],
        current: false,
        links: [],
        title: "ANOTHER_SECRET_COMPANY",
      },
    ],
    allProjects: [project],
    projects: [project],
    skills: [
      {
        items: ["TypeScript", "React"],
        title: "Frontend",
      },
    ],
    source: {
      repoName: "resume",
      repoUrl: "https://github.com/uiwwsw/resume",
      updatedAt: "2026-08-11T00:00:00Z",
      visibility: "private",
    },
    summary: "PUBLIC_SUMMARY",
    warnings: [],
  };
}

test("masks employment history while keeping public resume sections", () => {
  const result = buildPublicShowcaseResumeDocument(buildDocument(), {
    locale: "ko",
    username: "uiwwsw",
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.experience.length, 1);
  assert.equal(result.experience[0]?.title, "경력 정보 비공개");
  assert.doesNotMatch(serialized, /SECRET_COMPANY|SECRET_ROLE|SECRET_OFFICE/);
  assert.doesNotMatch(serialized, /SECRET_PHONE|SECRET_LOCATION|secret@example\.com/);

  assert.equal(result.summary, "PUBLIC_SUMMARY");
  assert.deepEqual(result.skills, buildDocument().skills);
  assert.deepEqual(result.education, buildDocument().education);
  assert.deepEqual(result.customSections, buildDocument().customSections);
  assert.equal(result.projects[0]?.title, "Public project");
  assert.equal(result.projects[0]?.bullets[0], "PUBLIC_PROJECT_DETAIL");
  assert.equal(result.projects[0]?.linkedExperienceTitle, undefined);
  assert.equal(result.basics.website, "https://example.com");
  assert.deepEqual(result.basics.links.map((link) => link.kind), ["live"]);
  assert.equal(
    result.basics.avatarUrl,
    "/api/public-resume-asset?username=uiwwsw&path=assets%2Fprofile.png",
  );
});

test("uses localized experience masking copy", () => {
  const result = buildPublicShowcaseResumeDocument(buildDocument(), {
    locale: "en",
    username: "uiwwsw",
  });

  assert.equal(result.experience[0]?.title, "Experience details withheld");
  assert.match(result.experience[0]?.bullets[0] ?? "", /hidden for privacy/);
});

test("builds concise SEO copy from public headline and skills only", () => {
  const result = buildPublicShowcaseResumeDocument(buildDocument(), {
    locale: "ko",
    username: "uiwwsw",
  });
  const title = getShowcaseSeoTitle("uiwwsw", "ko", result);
  const description = getShowcaseSeoDescription("uiwwsw", "ko", result);

  assert.equal(
    title,
    "Public name 프론트엔드 개발자 공개 이력서 | GitHubPrint",
  );
  assert.match(description, /Public headline/);
  assert.match(description, /TypeScript, React/);
  assert.doesNotMatch(description, /PUBLIC_SUMMARY|SECRET_COMPANY/);
  assert.ok(description.length <= 160);
});

test("publishes structured data for public education and projects without employment data", () => {
  const result = buildPublicShowcaseResumeDocument(buildDocument(), {
    locale: "ko",
    username: "uiwwsw",
  });
  const structuredData = buildShowcaseStructuredData("ko", "uiwwsw", result);
  const serialized = JSON.stringify(structuredData);

  assert.match(serialized, /Public education/);
  assert.match(serialized, /Public project/);
  assert.match(serialized, /PUBLIC_PROJECT_DETAIL/);
  assert.match(serialized, /2026-08-11T00:00:00Z/);
  assert.doesNotMatch(
    serialized,
    /SECRET_COMPANY|SECRET_ROLE|SECRET_OFFICE|SECRET_LOCATION|secret@example\.com/,
  );
});
