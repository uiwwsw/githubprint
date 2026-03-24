import type { ReactNode } from "react";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { getResumeCopy } from "@/lib/resume-copy";
import {
  buildResumeProjectEvidenceSummary,
  formatResumeProjectLabel,
  formatResumeDateRange,
  isResumeHighlightSectionId,
  parseResumeMarkdown,
  type ResumeCustomSection,
  type ResumeDocumentData,
  type ResumeEntry,
  type ResumeMarkdownBlock,
  type ResumeProject,
  type ResumeRepoVisibility,
} from "@/lib/resume";
import type { Locale } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";

type MarkdownSection = {
  blocks: ResumeMarkdownBlock[];
  heading?: string;
  subgroups: Array<{
    blocks: ResumeMarkdownBlock[];
    heading: string;
  }>;
};

function groupMarkdownBlocks(blocks: ResumeMarkdownBlock[]) {
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;
  let currentSubgroup: MarkdownSection["subgroups"][number] | null = null;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { blocks: [], subgroups: [] };
      sections.push(currentSection);
    }

    return currentSection;
  };

  blocks.forEach((block) => {
    if (block.type === "heading") {
      if (block.level <= 2) {
        currentSection = { blocks: [], heading: block.text, subgroups: [] };
        sections.push(currentSection);
        currentSubgroup = null;
        return;
      }

      const section = ensureSection();
      currentSubgroup = { blocks: [], heading: block.text };
      section.subgroups.push(currentSubgroup);
      return;
    }

    const section = ensureSection();
    if (currentSubgroup) {
      currentSubgroup.blocks.push(block);
      return;
    }

    section.blocks.push(block);
  });

  return sections.filter(
    (section) => section.heading || section.blocks.length > 0 || section.subgroups.length > 0,
  );
}

function MarkdownBlocks({ blocks }: { blocks: ResumeMarkdownBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`${block.type}-${index}`}
              className="list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700"
            >
              {block.items.map((item, itemIndex) => (
                <li className="print-copy-flow" key={`${index}-${itemIndex}-${item}`}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="print-copy-flow text-sm leading-7 text-neutral-700"
          >
            {block.text}
          </p>
        );
      })}
    </>
  );
}

function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = parseResumeMarkdown(markdown);
  const sections = groupMarkdownBlocks(blocks);
  const hasGroupedHeadings = sections.some((section) => section.heading);

  if (!hasGroupedHeadings) {
    return (
      <div className="space-y-3 text-sm leading-7 text-neutral-700">
        <MarkdownBlocks blocks={blocks} />
      </div>
    );
  }

  const introSection = sections[0]?.heading ? null : sections[0];
  const groupedSections = introSection ? sections.slice(1) : sections;

  return (
    <div className="space-y-4 text-sm leading-7 text-neutral-700">
      {introSection ? <MarkdownBlocks blocks={introSection.blocks} /> : null}
      {groupedSections.map((section, index) => (
        <section
          className="print-break-inside-avoid rounded-[1rem] border border-black/[0.06] bg-black/[0.025] px-4 py-4"
          key={`${section.heading ?? "group"}-${index}`}
        >
          {section.heading ? (
            <h4 className="text-[1.02rem] font-semibold leading-6 tracking-[-0.01em] text-neutral-950">
              {section.heading}
            </h4>
          ) : null}
          {section.blocks.length > 0 ? (
            <div className={cn("space-y-3", section.heading && "mt-3 border-t border-black/[0.06] pt-3")}>
              <MarkdownBlocks blocks={section.blocks} />
            </div>
          ) : null}
          {section.subgroups.length > 0 ? (
            <div className={cn("space-y-3", (section.heading || section.blocks.length > 0) && "mt-3")}>
              {section.subgroups.map((subgroup, subgroupIndex) => (
                <section
                  className="rounded-[0.9rem] border border-black/[0.06] bg-white/70 px-4 py-3"
                  key={`${section.heading ?? "group"}-${index}-subgroup-${subgroupIndex}`}
                >
                  <h5 className="text-[0.95rem] font-semibold leading-6 tracking-[-0.01em] text-neutral-900">
                    {subgroup.heading}
                  </h5>
                  {subgroup.blocks.length > 0 ? (
                    <div className="mt-2 space-y-3 border-t border-black/[0.05] pt-2.5">
                      <MarkdownBlocks blocks={subgroup.blocks} />
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function ResumeSection({
  bordered = true,
  children,
  title,
}: {
  bordered?: boolean;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className={cn(bordered && "border-t border-black/[0.08] pt-6")}>
      <div className="space-y-4">
        <div className="print-break-after-avoid">
          <h2 className="mt-0 font-serif text-2xl text-neutral-950">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function HighlightSectionContent({
  section,
}: {
  section: ResumeCustomSection;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {section.items.map((entry) => {
        const detail = entry.bullets[0] ?? entry.detailsMarkdown;

        return (
          <article
            className="print-break-inside-avoid rounded-[1.2rem] border border-black/[0.08] bg-white p-5"
            key={`${section.id}-${entry.title}`}
          >
            {entry.subtitle ? (
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                {entry.subtitle}
              </p>
            ) : null}
            <h3 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.01em] text-neutral-950">
              {entry.title}
            </h3>
            {detail ? (
              <p className="mt-3 text-sm leading-7 text-neutral-700">{detail}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function getUniqueLinks(links: ResumeEntry["links"]) {
  const seen = new Set<string>();

  return links.filter((link) => {
    const signature = `${link.kind}|${link.label}|${link.url}`;
    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function LinkRow({
  links,
  locale,
  showVerifiedBadge = false,
}: {
  links: ResumeEntry["links"];
  locale: Locale;
  showVerifiedBadge?: boolean;
}) {
  const copy = getResumeCopy(locale);
  const uniqueLinks = getUniqueLinks(links);

  if (uniqueLinks.length === 0) {
    return null;
  }

  return (
    <div className="print-break-inside-avoid flex flex-wrap gap-2">
      {uniqueLinks.map((link, index) => (
        <a
          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-black/[0.05]"
          href={link.url}
          key={`${link.kind}-${link.label}-${link.url}-${index}`}
          rel="noreferrer"
          target="_blank"
        >
          <span>{link.label}</span>
          {showVerifiedBadge && link.kind === "repo" ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
              {copy.template.repoVerified}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

function ResumeEntryBlock({
  entry,
  locale,
  relatedProjects,
}: {
  entry: ResumeEntry;
  locale: Locale;
  relatedProjects?: ResumeProject[];
}) {
  const copy = getResumeCopy(locale);
  const dateRange = formatResumeDateRange(
    entry.start,
    entry.end,
    entry.current,
    locale,
  );

  return (
    <article className="rounded-[1.2rem] border border-black/[0.08] bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-[-0.01em] text-neutral-950">{entry.title}</h3>
          {entry.subtitle ? (
            <p className="text-sm font-medium text-neutral-700">{entry.subtitle}</p>
          ) : null}
          {entry.location ? (
            <p className="text-sm text-neutral-500">{entry.location}</p>
          ) : null}
        </div>
        {dateRange ? (
          <p className="shrink-0 rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-600">
            {dateRange}
          </p>
        ) : null}
      </div>

      {entry.bullets.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700">
          {entry.bullets.map((bullet) => (
            <li className="print-copy-flow" key={bullet}>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}

      {entry.detailsMarkdown ? (
        <div className="mt-4">
          <MarkdownContent markdown={entry.detailsMarkdown} />
        </div>
      ) : null}

      {entry.links.length > 0 ? (
        <div className="mt-4">
          <LinkRow links={entry.links} locale={locale} />
        </div>
      ) : null}

      {relatedProjects && relatedProjects.length > 0 ? (
        <div className="mt-4 rounded-[1rem] bg-black/[0.025] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
            {copy.template.sections.projects}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedProjects.map((project) => (
              <span
                className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs text-neutral-700"
                key={`${entry.title}-${project.title}`}
              >
                {project.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ResumeProjectBlock({
  locale,
  project,
}: {
  locale: Locale;
  project: ResumeProject;
}) {
  const copy = getResumeCopy(locale);
  const projectContext = project.linkedExperienceTitle
    ? `${copy.shared.whileAt}: ${project.linkedExperienceTitle}`
    : copy.shared.independent;
  const dateRange = formatResumeDateRange(
    project.start,
    project.end,
    project.current,
    locale,
  );
  const localizedProjectLabels = project.projectLabels.map((label) =>
    formatResumeProjectLabel(label, locale),
  );
  const projectEvidenceSummary = buildResumeProjectEvidenceSummary(
    project,
    locale,
  );
  const showRepoDescription =
    Boolean(project.repoDescription) &&
    project.repoDescription !== project.subtitle;

  return (
    <article className="rounded-[1.2rem] border border-black/[0.08] bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-[-0.01em] text-neutral-950">{project.title}</h3>
          {project.subtitle ? (
            <p className="text-sm font-medium text-neutral-700">{project.subtitle}</p>
          ) : null}
          {project.location ? (
            <p className="text-sm text-neutral-500">{project.location}</p>
          ) : null}
        </div>
        {dateRange ? (
          <p className="shrink-0 rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-600">
            {dateRange}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-900">
          {projectContext}
        </span>
        {project.repoCreatedAt ? (
          <span className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-600">
            {copy.shared.githubStart}:{" "}
            {formatResumeDateRange(project.repoCreatedAt, undefined, false, locale)}
          </span>
        ) : null}
      </div>

      {localizedProjectLabels.length > 0 ? (
        <div className="mt-4 rounded-[1rem] bg-black/[0.025] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
            {copy.template.projectProfile}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {localizedProjectLabels.map((label) => (
              <span
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900"
                key={`${project.title}-${label}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showRepoDescription ? (
        <p className="mt-4 text-sm leading-7 text-neutral-700">
          {project.repoDescription}
        </p>
      ) : null}

      {projectEvidenceSummary ? (
        <p className="mt-4 text-sm leading-7 text-neutral-700">
          {projectEvidenceSummary}
        </p>
      ) : null}

      {project.tech.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-700"
              key={tech}
            >
              {tech}
            </span>
          ))}
        </div>
      ) : null}

      {project.bullets.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700">
          {project.bullets.map((bullet) => (
            <li className="print-copy-flow" key={bullet}>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}

      {project.detailsMarkdown ? (
        <div className="mt-4">
          <MarkdownContent markdown={project.detailsMarkdown} />
        </div>
      ) : null}

      {project.links.length > 0 ? (
        <div className="mt-4">
          <LinkRow
            links={project.links}
            locale={locale}
            showVerifiedBadge={project.repoVerified}
          />
        </div>
      ) : null}
    </article>
  );
}

function CustomSectionContent({
  locale,
  section,
}: {
  locale: Locale;
  section: ResumeCustomSection;
}) {
  if (section.layout === "chips") {
    return (
      <div className="flex flex-wrap gap-2">
        {section.items.map((item) => (
          <div
            className="print-break-inside-avoid rounded-full border border-black/[0.08] bg-black/[0.025] px-4 py-2 text-sm text-neutral-700"
            key={`${section.id}-${item.title}`}
          >
            {item.title}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(section.layout === "compact" ? "space-y-3" : "space-y-4")}>
      {section.items.map((item) => (
        <ResumeEntryBlock entry={item} key={`${section.id}-${item.title}`} locale={locale} />
      ))}
    </div>
  );
}

function getVisibilityLabel(
  locale: Locale,
  visibility: ResumeRepoVisibility,
) {
  const copy = getResumeCopy(locale);
  return visibility === "private" ? copy.shared.private : copy.shared.public;
}

export function ResumeTemplate({
  avatarUrl,
  generatedAt,
  locale,
  profileUrl,
  resume,
}: {
  avatarUrl?: string;
  generatedAt: string;
  locale: Locale;
  profileUrl: string;
  resume: ResumeDocumentData;
}) {
  const copy = getResumeCopy(locale);
  const resolvedAvatarUrl = resume.basics.avatarPath
    ? `/api/resume-asset?path=${encodeURIComponent(resume.basics.avatarPath)}`
    : resume.basics.avatarUrl ?? avatarUrl;
  const topLinks = resume.basics.links.filter((link) => link.kind !== "contact");
  const visibilityLabel = getVisibilityLabel(locale, resume.source.visibility);
  const projectsByExperience = new Map<string, ResumeProject[]>();
  const highlightSection = resume.customSections.find((section) =>
    isResumeHighlightSectionId(section.id),
  );
  const trailingSections = resume.customSections.filter(
    (section) => !isResumeHighlightSectionId(section.id),
  );

  resume.allProjects.forEach((project) => {
    if (!project.linkedExperienceTitle) {
      return;
    }

    const bucket = projectsByExperience.get(project.linkedExperienceTitle) ?? [];
    bucket.push(project);
    projectsByExperience.set(project.linkedExperienceTitle, bucket);
  });

  if (resume.basics.website) {
    topLinks.unshift({
      kind: "other",
      label: resume.basics.website,
      url: resume.basics.website,
    });
  }

  if (profileUrl) {
    topLinks.unshift({
      kind: "repo",
      label: "GitHub",
      url: profileUrl,
    });
  }

  return (
    <DocumentShell
      accent={
        <div className="flex flex-wrap gap-2">
          <MetaRibbon
            label={copy.template.ribbonTemplate}
            value="Resume"
          />
          <MetaRibbon
            label={copy.template.ribbonGenerated}
            value={formatDate(generatedAt, locale)}
          />
          <MetaRibbon
            label={copy.actions.repoVisibilityLabel}
            value={visibilityLabel}
          />
        </div>
      }
    >
      <header className="print-break-inside-avoid border-b border-black/[0.08] pb-8">
        <div className="space-y-4">
          <div>
            {resolvedAvatarUrl ? (
              <img
                alt={resume.basics.name}
                className="mb-5 h-20 w-20 rounded-[1.6rem] object-cover ring-1 ring-black/[0.08]"
                src={resolvedAvatarUrl}
              />
            ) : null}
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
              Resume
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.8rem,6vw,4.4rem)] leading-[1.02] text-neutral-950">
              {resume.basics.name}
            </h1>
            {resume.basics.headline ? (
              <p className="mt-3 text-lg leading-8 text-neutral-700">
                {resume.basics.headline}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
            {resume.basics.email ? (
              <span className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5">
                {resume.basics.email}
              </span>
            ) : null}
            {resume.basics.phone ? (
              <span className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5">
                {resume.basics.phone}
              </span>
            ) : null}
            {resume.basics.location ? (
              <span className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5">
                {resume.basics.location}
              </span>
            ) : null}
          </div>

          {topLinks.length > 0 ? <LinkRow links={topLinks} locale={locale} /> : null}
        </div>
      </header>

      <div className="mt-8 space-y-8">
        {highlightSection ? (
          <ResumeSection bordered={false} title={highlightSection.title}>
            <HighlightSectionContent section={highlightSection} />
          </ResumeSection>
        ) : null}

        <ResumeSection title={copy.template.sections.summary}>
          {resume.summary ? (
            <MarkdownContent markdown={resume.summary} />
          ) : (
            <p className="text-sm leading-7 text-neutral-500">
              {copy.template.noSummary}
            </p>
          )}
        </ResumeSection>

        <ResumeSection title={copy.template.sections.experience}>
          {resume.experience.length > 0 ? (
            <div className="space-y-4">
              {resume.experience.map((entry) => (
                <ResumeEntryBlock
                  entry={entry}
                  key={entry.title}
                  locale={locale}
                  relatedProjects={projectsByExperience.get(entry.title)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-neutral-500">
              {copy.template.emptyState}
            </p>
          )}
        </ResumeSection>

        <ResumeSection title={copy.template.sections.projects}>
          {resume.projects.length > 0 ? (
            <div className="space-y-4">
              {resume.projects.map((project) => (
                <ResumeProjectBlock key={project.title} locale={locale} project={project} />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-neutral-500">
              {copy.template.emptyState}
            </p>
          )}
        </ResumeSection>

        <ResumeSection title={copy.template.sections.education}>
          {resume.education.length > 0 ? (
            <div className="space-y-4">
              {resume.education.map((entry) => (
                <ResumeEntryBlock entry={entry} key={entry.title} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-neutral-500">
              {copy.template.emptyState}
            </p>
          )}
        </ResumeSection>

        <ResumeSection title={copy.template.sections.skills}>
          {resume.skills.length > 0 ? (
            <div className="space-y-4">
              {resume.skills.map((group, index) => (
                <div
                  className="rounded-[1.2rem] border border-black/[0.08] bg-white p-5"
                  key={`${group.title ?? "skills"}-${index}`}
                >
                  {group.title ? (
                    <p className="text-sm font-medium text-neutral-900">{group.title}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-700"
                        key={item}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-neutral-500">
              {copy.template.emptyState}
            </p>
          )}
        </ResumeSection>

        {trailingSections.map((section) => (
          <ResumeSection key={section.id} title={section.title}>
            {section.items.length > 0 ? (
              <CustomSectionContent locale={locale} section={section} />
            ) : (
              <p className="text-sm leading-7 text-neutral-500">
                {copy.template.emptyState}
              </p>
            )}
          </ResumeSection>
        ))}
      </div>
    </DocumentShell>
  );
}
