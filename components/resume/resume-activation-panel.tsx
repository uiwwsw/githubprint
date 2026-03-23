"use client";

import { getResumeCopy } from "@/lib/resume-copy";
import type { ResumeTemplateAvailability } from "@/lib/resume";
import type { Locale } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STARTER_TREE = `resume/
  resume.yaml
  resume.en.yaml
  content/
    ko/
      summary.md
      experience/
        product-lead.md
    en/
      summary.md
      experience/
        product-lead.md`;

const STARTER_YAML_KO = `basics:
  name: "Your Name"
  avatar: "assets/profile.jpg"
  headline: "제품과 구현을 함께 다루는 개발자"
  location: "Seoul, KR"
  website: "https://example.com"
  links:
    - label: "GitHub"
      url: "https://github.com/your-name"
      kind: "repo"

summary:
  markdown: "content/ko/summary.md"

experience:
  - title: "GitHubPrint"
    subtitle: "공동창업 / 프론트엔드 개발"
    start: "2025-01-01"
    current: true
    bullets: ["제품, 디자인, 구현을 처음부터 끝까지 맡았습니다."]
    detailsMarkdown:
      markdown: "content/ko/experience/product-lead.md"

projects:
  - title: "GitHubPrint"
    repo: "githubprint"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript", "OpenAI"]

education: []

skills:
  - title: "Core"
    items: ["TypeScript", "React", "Next.js"]

customSections: []`;

const STARTER_YAML_EN = `basics:
  name: "Your Name"
  avatar: "assets/profile.jpg"
  headline: "A developer who handles both product and implementation"
  location: "Seoul, KR"
  website: "https://example.com"
  links:
    - label: "GitHub"
      url: "https://github.com/your-name"
      kind: "repo"

summary:
  markdown: "content/en/summary.md"

experience:
  - title: "GitHubPrint"
    subtitle: "Co-founder / Frontend Engineer"
    start: "2025-01-01"
    current: true
    bullets: ["Built product, design, and engineering end to end."]
    detailsMarkdown:
      markdown: "content/en/experience/product-lead.md"

projects:
  - title: "GitHubPrint"
    repo: "githubprint"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript", "OpenAI"]

education: []

skills:
  - title: "Core"
    items: ["TypeScript", "React", "Next.js"]

customSections: []`;

type ResumeActivationPanelProps = {
  availability: ResumeTemplateAvailability;
  locale: Locale;
  onClose?: () => void;
};

export function ResumeActivationPanel({
  availability,
  locale,
  onClose,
}: ResumeActivationPanelProps) {
  const copy = getResumeCopy(locale);
  const isInvalid = availability.state === "locked_invalid_schema";

  return (
    <section className="rounded-[1.5rem] border border-black/[0.08] bg-white/90 p-5 shadow-[0_30px_80px_-52px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
            Resume
          </p>
          <h3 className="font-serif text-2xl text-neutral-950">
            {copy.panel.title}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-neutral-600">
            {copy.panel.subtitle}
          </p>
        </div>
        {onClose ? (
          <button
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-950/5"
            onClick={onClose}
            type="button"
          >
            {copy.panel.close}
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/[0.08] bg-black/[0.025] p-4">
        <p className="text-sm font-medium text-neutral-900">
          {copy.shared.public} / {copy.shared.private}
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {copy.panel.toggleHint}
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {copy.panel.togglePublic}: {copy.panel.togglePublicHint}
        </p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          {copy.panel.togglePrivate}: {copy.panel.togglePrivateHint}
        </p>
      </div>

      <div
        className={cn(
          "mt-5 rounded-[1.2rem] border px-4 py-3 text-sm leading-6",
          isInvalid
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-sky-200 bg-sky-50 text-sky-900",
        )}
      >
        <p className="font-medium">
          {isInvalid ? copy.panel.invalidTitle : copy.panel.missingTitle}
        </p>
        <p className="mt-1">
          {isInvalid ? copy.panel.invalidMessage : copy.panel.missingMessage}
        </p>
        {availability.state === "locked_invalid_schema" ? (
          <p className="mt-2 text-sm">
            {copy.panel.invalidReasonLabel}: {availability.detail}
          </p>
        ) : null}
        {"repoUrl" in availability ? (
          <a
            className="mt-2 inline-flex break-all underline decoration-current/30 underline-offset-4"
            href={availability.repoUrl}
            rel="noreferrer"
            target="_blank"
          >
            {availability.repoUrl}
          </a>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {copy.panel.benefitsTitle}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              {copy.panel.benefits.map((item) => (
                <li key={item} className="rounded-[1rem] bg-black/[0.025] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-900">
              {copy.panel.stepsTitle}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              {copy.panel.steps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-[1rem] border border-black/[0.08] px-4 py-3"
                >
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {copy.panel.enabledTitle}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              {copy.panel.enabledFeatures.map((item) => (
                <li
                  key={item}
                  className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-900">
              {copy.panel.starterTitle}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-black/[0.08] bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
              {STARTER_TREE}
            </pre>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              resume.yaml
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-black/[0.08] bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
              {STARTER_YAML_KO}
            </pre>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              resume.en.yaml
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-black/[0.08] bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
              {STARTER_YAML_EN}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
