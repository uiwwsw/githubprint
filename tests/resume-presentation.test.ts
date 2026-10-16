import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeTemplate } from "../components/templates/resume";
import type { ResumeDocumentData } from "../lib/resume";

test("embedded authored-only Resume keeps the original template and authored content in both locales", () => {
  const project = {
    title: "Authored project", bullets: ["Authored responsibility"], current: false,
    links: [], tech: ["TypeScript"], projectLabels: ["automation"],
    repoVerified: true, repoDescription: "Repository description enrichment",
    repoCreatedAt: "2020-01-01",
  };
  const resume: ResumeDocumentData = {
    basics: { name: "Author", links: [] }, projects: [project], allProjects: [project],
    experience: [], education: [], customSections: [], skills: [], warnings: [],
    source: { repoName: "resume", repoUrl: "https://github.com/author/resume", visibility: "private" },
  };
  for (const locale of ["ko", "en"] as const) {
    const props = { resume, locale, generatedAt: "2026-10-16T00:00:00Z", profileUrl: "" };
    const normal = renderToStaticMarkup(createElement(ResumeTemplate, props));
    const authored = renderToStaticMarkup(createElement(ResumeTemplate, { ...props, authoredOnly: true }));
    assert.match(normal, /Repository description enrichment/);
    assert.doesNotMatch(authored, /Repository description enrichment|2020|자동화|Automation|중심으로 확인|primarily/);
    assert.match(authored, /data-template="resume"/);
    assert.match(authored, /Authored project/);
    assert.match(authored, /Authored responsibility/);
    assert.match(authored, /TypeScript/);
  }
});
