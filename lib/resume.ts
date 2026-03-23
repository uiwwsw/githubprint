import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { Locale } from "@/lib/schemas";

export type ResumeRepoVisibility = "public" | "private";
export type ResumeTemplateState =
  | "locked_missing_repo"
  | "locked_invalid_schema"
  | "ready";

type ResumeLocalizedTextInput =
  | string
  | {
      en?: string;
      ko?: string;
    };

type ResumeMarkdownInput =
  | {
      markdown: string;
    }
  | {
      markdown: {
        en?: string;
        ko?: string;
      };
    };

type ResumeAssetPathInput = string;

const localizedTextSchema = z
  .union([
    z.string().trim().min(1),
    z.object({
      en: z.string().trim().min(1).optional(),
      ko: z.string().trim().min(1).optional(),
    }),
  ])
  .refine(
    (value) =>
      typeof value === "string" ||
      Boolean(value.ko?.trim() || value.en?.trim()),
    {
      message: "Expected text or a localized text object with ko/en content.",
    },
  );

const markdownSourceSchema = z
  .union([
    z.object({
      markdown: z.string().trim().min(1),
    }),
    z.object({
      markdown: z
        .object({
          en: z.string().trim().min(1).optional(),
          ko: z.string().trim().min(1).optional(),
        })
        .refine((value) => Boolean(value.ko?.trim() || value.en?.trim()), {
          message: "Expected markdown path content in ko or en.",
        }),
    }),
  ])
  .refine((value) => Boolean(value.markdown), {
    message: "Expected a markdown file reference.",
  });

const textSourceSchema = z.union([localizedTextSchema, markdownSourceSchema]);

const linkSchema = z.object({
  kind: z.enum(["contact", "docs", "live", "other", "repo"]).optional(),
  label: localizedTextSchema.optional(),
  url: z.url(),
});

const resumeItemSchema = z.object({
  bullets: z.array(localizedTextSchema).optional(),
  current: z.boolean().optional(),
  detailsMarkdown: textSourceSchema.optional(),
  end: z.string().trim().min(1).optional(),
  links: z.array(linkSchema).optional(),
  location: localizedTextSchema.optional(),
  start: z.string().trim().min(1).optional(),
  subtitle: localizedTextSchema.optional(),
  title: localizedTextSchema,
});

const resumeProjectSchema = resumeItemSchema.extend({
  id: z.string().trim().min(1).optional(),
  liveUrl: z.url().optional(),
  repo: z.string().trim().min(1).optional(),
  tech: z.array(localizedTextSchema).optional(),
});

const resumeEducationSchema = z.union([
  resumeItemSchema,
  z.object({
    degree: localizedTextSchema.optional(),
    end: z.string().trim().min(1).optional(),
    school: localizedTextSchema,
    start: z.string().trim().min(1).optional(),
    status: localizedTextSchema.optional(),
  }),
]);

const featuredProjectReferenceSchema = z.union([
  z.string().trim().min(1),
  z
    .object({
      project: z.string().trim().min(1).optional(),
      repo: z.string().trim().min(1).optional(),
    })
    .refine((value) => Boolean(value.project || value.repo), {
      message: "Expected project or repo in featuredProjects.",
    }),
]);

const resumeSkillSchema = z.union([
  localizedTextSchema,
  z.object({
    items: z.array(localizedTextSchema).min(1),
    title: localizedTextSchema.optional(),
  }),
]);

const customSectionItemSchema = z.union([
  z.object({
    date: z.string().trim().min(1).optional(),
    note: localizedTextSchema.optional(),
    organization: localizedTextSchema.optional(),
    title: localizedTextSchema,
  }),
  resumeItemSchema,
]);

const customSectionSchema = z.object({
  id: z.string().trim().min(1).optional(),
  items: z.array(customSectionItemSchema).optional(),
  layout: z.enum(["chips", "compact", "list"]).optional(),
  title: localizedTextSchema,
});

const basicsSchema = z.object({
  avatar: z.string().trim().min(1).optional(),
  avatarUrl: z.url().optional(),
  email: z.email().optional(),
  headline: localizedTextSchema.optional(),
  links: z.array(linkSchema).optional(),
  location: localizedTextSchema.optional(),
  name: localizedTextSchema,
  phone: z.string().trim().min(1).optional(),
  website: z.url().optional(),
});

const rawResumeDocumentSchema = z.object({
  basics: basicsSchema,
  customSections: z.array(customSectionSchema).optional(),
  education: z.array(resumeEducationSchema).optional(),
  experience: z.array(resumeItemSchema).optional(),
  featuredProjects: z.array(featuredProjectReferenceSchema).optional(),
  projects: z.array(resumeProjectSchema).optional(),
  skills: z.array(resumeSkillSchema).optional(),
  summary: textSourceSchema.optional(),
});

export type RawResumeDocument = z.infer<typeof rawResumeDocumentSchema>;

export type ResumeLinkKind = "contact" | "docs" | "live" | "other" | "repo";

export type ResumeLink = {
  kind: ResumeLinkKind;
  label: string;
  url: string;
};

export type ResumeEntry = {
  bullets: string[];
  current: boolean;
  detailsMarkdown?: string;
  end?: string;
  sortDate?: string;
  links: ResumeLink[];
  location?: string;
  start?: string;
  subtitle?: string;
  title: string;
};

export type ResumeProject = ResumeEntry & {
  id?: string;
  linkedExperienceTitle?: string;
  liveUrl?: string;
  repoCreatedAt?: string;
  repoDescription?: string;
  projectLabels: string[];
  repoSlug?: string;
  repoUrl?: string;
  repoUpdatedAt?: string;
  repoVerified: boolean;
  tech: string[];
};

export type ResumeSkillGroup = {
  items: string[];
  title?: string;
};

export type ResumeCustomSection = {
  id: string;
  items: ResumeEntry[];
  layout: "chips" | "compact" | "list";
  title: string;
};

export type ResumeDocumentData = {
  basics: {
    avatarPath?: string;
    avatarUrl?: string;
    email?: string;
    headline?: string;
    links: ResumeLink[];
    location?: string;
    name: string;
    phone?: string;
    website?: string;
  };
  customSections: ResumeCustomSection[];
  education: ResumeEntry[];
  experience: ResumeEntry[];
  allProjects: ResumeProject[];
  projects: ResumeProject[];
  skills: ResumeSkillGroup[];
  source: {
    repoName: "resume";
    repoUrl: string;
    updatedAt?: string;
    visibility: ResumeRepoVisibility;
  };
  summary?: string;
};

export type ResumeTemplateAvailability =
  | {
      state: "locked_missing_repo";
    }
  | {
      detail: string;
      repoUrl: string;
      repoVisibility: ResumeRepoVisibility;
      state: "locked_invalid_schema";
    }
  | {
      document: ResumeDocumentData;
      repoUrl: string;
      repoVisibility: ResumeRepoVisibility;
      state: "ready";
    };

export type ResumeMarkdownBlock =
  | {
      text: string;
      type: "heading";
    }
  | {
      items: string[];
      type: "list";
    }
  | {
      text: string;
      type: "paragraph";
    };

type ResumeFileReference = string | { en?: string; ko?: string };
type ResumeFeaturedProjectReference =
  | string
  | {
      project?: string;
      repo?: string;
    };

type BuildResumeDocumentOptions = {
  contentFiles: Record<string, string>;
  locale: Locale;
  repoCatalog: Array<{
    createdAt: string;
    description: string | null;
    homepageUrl: string;
    language: string | null;
    name: string;
    projectLabels: string[];
    pushedAt: string;
    repoUrl: string;
    topics: string[];
    updatedAt: string;
  }>;
  repoUrl: string;
  updatedAt?: string;
  username: string;
  visibility: ResumeRepoVisibility;
};

const MARKDOWN_FILE_PATTERN = /^content\/[a-z0-9/_.-]+\.(md|markdown)$/i;
const ASSET_FILE_PATTERN =
  /^assets\/[a-z0-9/_.-]+\.(png|jpg|jpeg|gif|webp|bmp)$/i;
const RESUME_PROJECT_LABELS: Record<string, { en: string; ko: string }> = {
  ai: {
    en: "AI",
    ko: "AI",
  },
  automation: {
    en: "Automation",
    ko: "자동화",
  },
  backend: {
    en: "Backend",
    ko: "백엔드",
  },
  devtools: {
    en: "Developer Tool",
    ko: "개발자 도구",
  },
  docs: {
    en: "Documentation",
    ko: "문서",
  },
  frontend: {
    en: "Frontend",
    ko: "프론트엔드",
  },
  mobile: {
    en: "Mobile",
    ko: "모바일",
  },
};

function pickLocalizedText(
  value: ResumeLocalizedTextInput,
  locale: Locale,
) {
  if (typeof value === "string") {
    return value.trim();
  }

  const preferred = locale === "ko" ? value.ko : value.en;
  const fallback = locale === "ko" ? value.en : value.ko;
  return (preferred ?? fallback ?? "").trim();
}

export function formatResumeProjectLabel(
  label: string,
  locale: Locale,
) {
  const normalized = label.trim().toLowerCase();
  const mapped = RESUME_PROJECT_LABELS[normalized];

  if (!mapped) {
    return label.trim();
  }

  return locale === "ko" ? mapped.ko : mapped.en;
}

function joinReadableResumeItems(items: string[], locale: Locale) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  return locale === "ko"
    ? `${items.slice(0, -1).join(", ")}와 ${items[items.length - 1]}`
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildResumeProjectEvidenceSummary(
  project: ResumeProject,
  locale: Locale,
) {
  const localizedLabels = project.projectLabels
    .map((label) => formatResumeProjectLabel(label, locale))
    .filter(Boolean)
    .slice(0, 2);
  const tech = project.tech.filter(Boolean).slice(0, 3);
  const hasLiveLink = Boolean(project.liveUrl);
  const hasRepoLink = Boolean(project.repoUrl);
  const sentences: string[] = [];

  if (localizedLabels.length > 0) {
    const labelsText = joinReadableResumeItems(localizedLabels, locale);
    sentences.push(
      locale === "ko"
        ? `GitHub 기준으로는 ${labelsText} 성격이 보입니다.`
        : `Based on the GitHub evidence, this reads most clearly as ${labelsText} work.`,
    );
  }

  if (tech.length > 0) {
    const techText = joinReadableResumeItems(tech, locale);
    sentences.push(
      locale === "ko"
        ? `${techText} 중심으로 확인됩니다.`
        : `The clearest stack centers on ${techText}.`,
    );
  }

  if (hasLiveLink && project.repoVerified) {
    sentences.push(
      locale === "ko"
        ? "서비스 링크와 검증된 GitHub 저장소가 함께 연결되어 있습니다."
        : "It includes both a live link and a verified GitHub repository.",
    );
  } else if (hasLiveLink) {
    sentences.push(
      locale === "ko"
        ? "서비스 링크가 함께 연결되어 있습니다."
        : "It also includes a live link.",
    );
  } else if (project.repoVerified) {
    sentences.push(
      locale === "ko"
        ? "현재 GitHub 계정의 저장소와 직접 연결되어 있습니다."
        : "It is directly linked to a repository owned by the current GitHub account.",
    );
  } else if (hasRepoLink) {
    sentences.push(
      locale === "ko"
        ? "GitHub 저장소 링크가 함께 연결되어 있습니다."
        : "It also includes a GitHub repository link.",
    );
  }

  return sentences.join(" ");
}

function normalizeContentPath(path: string) {
  const normalized = path.trim().replace(/^\.?\//, "");

  if (!MARKDOWN_FILE_PATTERN.test(normalized) || normalized.includes("..")) {
    throw new Error(
      "Markdown references must stay inside content/ and end with .md or .markdown.",
    );
  }

  return normalized;
}

function normalizeAssetPath(path: ResumeAssetPathInput) {
  const normalized = path.trim().replace(/^\.?\//, "");

  if (!ASSET_FILE_PATTERN.test(normalized) || normalized.includes("..")) {
    throw new Error(
      "Avatar references must stay inside assets/ and use png, jpg, jpeg, gif, webp, or bmp.",
    );
  }

  return normalized;
}

function pickLocalizedPath(value: ResumeFileReference, locale: Locale) {
  if (typeof value === "string") {
    return normalizeContentPath(value);
  }

  const preferred = locale === "ko" ? value.ko : value.en;
  const fallback = locale === "ko" ? value.en : value.ko;

  if (!preferred && !fallback) {
    throw new Error("Markdown references require ko or en paths.");
  }

  return normalizeContentPath(preferred ?? fallback ?? "");
}

function isMarkdownSource(
  value: z.infer<typeof textSourceSchema>,
): value is ResumeMarkdownInput {
  return typeof value === "object" && value !== null && "markdown" in value;
}

function readTextSource(
  value: z.infer<typeof textSourceSchema>,
  locale: Locale,
  contentFiles: Record<string, string>,
) {
  if (!isMarkdownSource(value)) {
    return pickLocalizedText(value, locale);
  }

  const filePath = pickLocalizedPath(value.markdown, locale);
  const hasContentFile = Object.prototype.hasOwnProperty.call(contentFiles, filePath);

  if (!hasContentFile) {
    throw new Error(`Missing referenced Markdown file: ${filePath}`);
  }

  return contentFiles[filePath]?.trim() ?? "";
}

function readOptionalTextSource(
  value: z.infer<typeof textSourceSchema> | undefined,
  locale: Locale,
  contentFiles: Record<string, string>,
) {
  if (!value) {
    return undefined;
  }

  const text = readTextSource(value, locale, contentFiles);
  return text || undefined;
}

function inferLinkKind(url: string): ResumeLinkKind {
  if (url.includes("github.com")) {
    return "repo";
  }
  if (url.includes("docs.") || url.includes("/docs")) {
    return "docs";
  }
  return "other";
}

function normalizeLink(
  link: z.infer<typeof linkSchema>,
  locale: Locale,
): ResumeLink {
  const kind: ResumeLinkKind = link.kind ?? inferLinkKind(link.url);
  const label =
    (link.label ? pickLocalizedText(link.label, locale) : "") ||
    (kind === "repo"
      ? "GitHub"
      : kind === "docs"
        ? locale === "ko"
          ? "문서"
          : "Docs"
        : kind === "live"
          ? locale === "ko"
            ? "서비스"
            : "Live"
          : kind === "contact"
            ? locale === "ko"
              ? "연락처"
              : "Contact"
            : locale === "ko"
              ? "링크"
              : "Link");

  return {
    kind,
    label,
    url: link.url,
  };
}

function isGroupedSkill(
  skillGroup: z.infer<typeof resumeSkillSchema>,
): skillGroup is {
  items: ResumeLocalizedTextInput[];
  title?: ResumeLocalizedTextInput;
} {
  return typeof skillGroup === "object" && skillGroup !== null && "items" in skillGroup;
}

function isResumeEducationRecord(
  entry: z.infer<typeof resumeEducationSchema>,
): entry is {
  degree?: ResumeLocalizedTextInput;
  end?: string;
  school: ResumeLocalizedTextInput;
  start?: string;
  status?: ResumeLocalizedTextInput;
} {
  return typeof entry === "object" && entry !== null && "school" in entry;
}

function isLegacyCustomSectionItem(
  item: z.infer<typeof customSectionItemSchema>,
): item is {
  date?: string;
  note?: ResumeLocalizedTextInput;
  organization?: ResumeLocalizedTextInput;
  title: ResumeLocalizedTextInput;
} {
  return typeof item === "object" && item !== null && "date" in item;
}

function normalizeEntry(
  item: z.infer<typeof resumeItemSchema>,
  locale: Locale,
  contentFiles: Record<string, string>,
): ResumeEntry {
  return {
    bullets:
      item.bullets?.map((bullet) => pickLocalizedText(bullet, locale)).filter(Boolean) ??
      [],
    current: Boolean(item.current),
    detailsMarkdown: readOptionalTextSource(
      item.detailsMarkdown,
      locale,
      contentFiles,
    ),
    end: item.end?.trim() || undefined,
    links: (item.links ?? []).map((link) => normalizeLink(link, locale)),
    location: item.location
      ? pickLocalizedText(item.location, locale)
      : undefined,
    sortDate: item.start?.trim() || item.end?.trim() || undefined,
    start: item.start?.trim() || undefined,
    subtitle: item.subtitle
      ? pickLocalizedText(item.subtitle, locale)
      : undefined,
    title: pickLocalizedText(item.title, locale),
  };
}

function toSectionId(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeEducationEntry(
  item: z.infer<typeof resumeEducationSchema>,
  locale: Locale,
  contentFiles: Record<string, string>,
): ResumeEntry {
  if (!isResumeEducationRecord(item)) {
    return normalizeEntry(item, locale, contentFiles);
  }

  const degree = item.degree ? pickLocalizedText(item.degree, locale) : "";
  const status = item.status ? pickLocalizedText(item.status, locale) : "";
  const subtitle = [degree, status].filter(Boolean).join(" · ");

  return {
    bullets: [],
    current: false,
    end: item.end?.trim() || undefined,
    links: [],
    sortDate: item.start?.trim() || item.end?.trim() || undefined,
    start: item.start?.trim() || undefined,
    subtitle: subtitle || undefined,
    title: pickLocalizedText(item.school, locale),
  };
}

function normalizeCustomSectionItem(
  item: z.infer<typeof customSectionItemSchema>,
  locale: Locale,
  contentFiles: Record<string, string>,
): ResumeEntry {
  if (!isLegacyCustomSectionItem(item)) {
    return normalizeEntry(item, locale, contentFiles);
  }

  const note = item.note ? pickLocalizedText(item.note, locale) : "";

  return {
    bullets: note ? [note] : [],
    current: false,
    links: [],
    sortDate: item.date?.trim() || undefined,
    start: item.date?.trim() || undefined,
    subtitle: item.organization
      ? pickLocalizedText(item.organization, locale)
      : undefined,
    title: pickLocalizedText(item.title, locale),
  };
}

type ResumeRepoCatalogEntry = {
  createdAt: string;
  description: string | null;
  homepageUrl: string;
  language: string | null;
  name: string;
  projectLabels: string[];
  pushedAt: string;
  repoUrl: string;
  topics: string[];
  updatedAt: string;
};

function resolveProjectRepoReference(
  repo: string,
  username: string,
  repoCatalog: Map<string, ResumeRepoCatalogEntry>,
) {
  const trimmed = repo.trim();
  const matched =
    trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
  const normalizedSlug = matched
    ? `${matched[1]}/${matched[2]}`
    : trimmed.includes("/")
      ? trimmed.replace(/\.git$/i, "")
      : `${username}/${trimmed}`;
  const repoName = normalizedSlug.split("/").at(-1)?.toLowerCase() ?? "";
  const ownedRepo = repoCatalog.get(repoName);
  const repoUrl = matched
    ? trimmed.replace(/\.git$/i, "")
    : ownedRepo?.repoUrl ?? `https://github.com/${normalizedSlug}`;
  const repoVerified = Boolean(
    ownedRepo &&
      normalizedSlug.toLowerCase() ===
        `${username}/${ownedRepo.name}`.toLowerCase(),
  );

  return {
    normalizedSlug,
    ownedRepo,
    repoName,
    repoUrl,
    repoVerified,
  };
}

function dedupeProjectLinks(links: ResumeLink[]) {
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

function normalizeProject(
  item: z.infer<typeof resumeProjectSchema>,
  locale: Locale,
  contentFiles: Record<string, string>,
  username: string,
  repoCatalog: Map<string, ResumeRepoCatalogEntry>,
): ResumeProject {
  const entry = normalizeEntry(item, locale, contentFiles);
  const tech =
    item.tech?.map((value) => pickLocalizedText(value, locale)).filter(Boolean) ??
    [];
  const projectLinks = [...entry.links];
  let repoSlug: string | undefined;
  let repoUrl: string | undefined;
  let repoVerified = false;
  let repoCreatedAt: string | undefined;
  let repoUpdatedAt: string | undefined;
  let repoDescription: string | undefined;
  let projectLabels: string[] = [];

  if (item.repo) {
    const resolvedRepo = resolveProjectRepoReference(
      item.repo,
      username,
      repoCatalog,
    );
    const ownedRepo = resolvedRepo.ownedRepo;

    repoSlug = resolvedRepo.normalizedSlug;
    repoUrl = resolvedRepo.repoUrl;
    repoVerified = resolvedRepo.repoVerified;
    repoCreatedAt = ownedRepo?.createdAt;
    repoUpdatedAt = ownedRepo?.updatedAt;
    repoDescription = ownedRepo?.description ?? undefined;
    projectLabels = ownedRepo?.projectLabels ?? [];

    projectLinks.unshift({
      kind: "repo",
      label: repoVerified ? "GitHub" : "GitHub repo",
      url: repoUrl,
    });
  }

  if (item.liveUrl) {
    projectLinks.push({
      kind: "live",
      label: locale === "ko" ? "서비스" : "Live",
      url: item.liveUrl,
    });
  }

  return {
    ...entry,
    id: item.id?.trim() || undefined,
    linkedExperienceTitle: undefined,
    links: dedupeProjectLinks(projectLinks),
    liveUrl: item.liveUrl,
    repoCreatedAt,
    repoDescription,
    projectLabels,
    repoSlug,
    repoUrl,
    repoUpdatedAt,
    repoVerified,
    sortDate: entry.start ?? repoCreatedAt ?? repoUpdatedAt ?? entry.end,
    subtitle: entry.subtitle ?? repoDescription,
    tech,
  };
}

function buildRepoBackedProject(
  repo: string,
  locale: Locale,
  username: string,
  repoCatalog: Map<string, ResumeRepoCatalogEntry>,
): ResumeProject {
  const resolvedRepo = resolveProjectRepoReference(repo, username, repoCatalog);
  const ownedRepo = resolvedRepo.ownedRepo;
  const liveUrl = ownedRepo?.homepageUrl || undefined;
  const links: ResumeLink[] = [
    {
      kind: "repo",
      label: resolvedRepo.repoVerified ? "GitHub" : "GitHub repo",
      url: resolvedRepo.repoUrl,
    },
  ];

  if (liveUrl) {
    links.push({
      kind: "live",
      label: locale === "ko" ? "서비스" : "Live",
      url: liveUrl,
    });
  }

  return {
    bullets: [],
    current: false,
    id: resolvedRepo.normalizedSlug,
    linkedExperienceTitle: undefined,
    links: dedupeProjectLinks(links),
    liveUrl,
    projectLabels: ownedRepo?.projectLabels ?? [],
    repoCreatedAt: ownedRepo?.createdAt,
    repoDescription: ownedRepo?.description ?? undefined,
    repoSlug: resolvedRepo.normalizedSlug,
    repoUrl: resolvedRepo.repoUrl,
    repoUpdatedAt: ownedRepo?.updatedAt,
    repoVerified: resolvedRepo.repoVerified,
    sortDate: ownedRepo?.createdAt ?? ownedRepo?.updatedAt,
    start: undefined,
    subtitle: ownedRepo?.description ?? undefined,
    tech: ownedRepo?.language ? [ownedRepo.language] : [],
    title: ownedRepo?.name ?? resolvedRepo.repoName,
  };
}

function normalizeSkills(
  skills: z.infer<typeof rawResumeDocumentSchema>["skills"],
  locale: Locale,
) {
  return (skills ?? []).map((skillGroup) => {
    if (!isGroupedSkill(skillGroup)) {
      return {
        items: [pickLocalizedText(skillGroup, locale)],
      } satisfies ResumeSkillGroup;
    }

    return {
      items: skillGroup.items
        .map((item) => pickLocalizedText(item, locale))
        .filter(Boolean),
      title: skillGroup.title
        ? pickLocalizedText(skillGroup.title, locale)
        : undefined,
    } satisfies ResumeSkillGroup;
  });
}

function getComparableDate(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortResumeEntries<T extends ResumeEntry>(entries: T[]) {
  return [...entries].sort((left, right) => {
    if (left.current !== right.current) {
      return left.current ? -1 : 1;
    }

    const rightDate = getComparableDate(
      right.sortDate ?? right.start ?? right.end,
    );
    const leftDate = getComparableDate(
      left.sortDate ?? left.start ?? left.end,
    );

    if (leftDate !== null && rightDate !== null && leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    if (leftDate === null && rightDate !== null) {
      return 1;
    }

    if (leftDate !== null && rightDate === null) {
      return -1;
    }

    return left.title.localeCompare(right.title);
  });
}

function experienceContainsDate(entry: ResumeEntry, target: number) {
  const start = getComparableDate(entry.start);
  const end = entry.current
    ? Date.now()
    : getComparableDate(entry.end ?? entry.sortDate);

  if (start === null) {
    return false;
  }

  if (target < start) {
    return false;
  }

  if (end !== null && target > end) {
    return false;
  }

  return true;
}

function linkProjectsToExperience(
  projects: ResumeProject[],
  experience: ResumeEntry[],
) {
  return projects.map((project) => {
    const projectDate = getComparableDate(
      project.start ?? project.repoCreatedAt ?? project.repoUpdatedAt ?? project.end,
    );

    if (projectDate === null) {
      return project;
    }

    const matchingExperience = sortResumeEntries(
      experience.filter((entry) => experienceContainsDate(entry, projectDate)),
    )[0];

    return {
      ...project,
      linkedExperienceTitle: matchingExperience?.title,
    };
  });
}

function findExplicitProjectByReference(
  reference: string,
  projects: ResumeProject[],
  username: string,
) {
  const normalized = reference.trim().toLowerCase();

  return (
    projects.find((project) => project.id?.toLowerCase() === normalized) ??
    projects.find((project) => project.repoSlug?.toLowerCase() === normalized) ??
    projects.find(
      (project) =>
        project.repoSlug?.toLowerCase() === `${username}/${normalized}`,
    ) ??
    projects.find(
      (project) =>
        project.repoSlug?.split("/").at(-1)?.toLowerCase() === normalized,
    ) ??
    projects.find((project) => project.title.trim().toLowerCase() === normalized)
  );
}

function dedupeProjects(projects: ResumeProject[]) {
  const seen = new Set<string>();

  return projects.filter((project) => {
    const signature =
      project.id?.toLowerCase() ??
      project.repoSlug?.toLowerCase() ??
      project.repoUrl?.toLowerCase() ??
      project.title.trim().toLowerCase();

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function resolveFeaturedProjects(
  references: ResumeFeaturedProjectReference[] | undefined,
  explicitProjects: ResumeProject[],
  locale: Locale,
  username: string,
  repoCatalog: Map<string, ResumeRepoCatalogEntry>,
) {
  if (!references || references.length === 0) {
    return explicitProjects;
  }

  return dedupeProjects(
    references.map((reference) => {
      if (typeof reference === "string") {
        const explicitProject = findExplicitProjectByReference(
          reference,
          explicitProjects,
          username,
        );

        if (!explicitProject) {
          throw new Error(`Featured project reference not found: ${reference}`);
        }

        return explicitProject;
      }

      if (reference.project) {
        const explicitProject = findExplicitProjectByReference(
          reference.project,
          explicitProjects,
          username,
        );

        if (!explicitProject) {
          throw new Error(
            `Featured project reference not found: ${reference.project}`,
          );
        }

        return explicitProject;
      }

      if (!reference.repo) {
        throw new Error("Featured project entries require project or repo.");
      }

      return (
        findExplicitProjectByReference(
          reference.repo,
          explicitProjects,
          username,
        ) ??
        buildRepoBackedProject(reference.repo, locale, username, repoCatalog)
      );
    }),
  );
}

export function parseResumeYamlDocument(source: string) {
  try {
    const parsed = parseYaml(source);
    const result = rawResumeDocumentSchema.safeParse(parsed);

    if (!result.success) {
      const issue = result.error.issues[0];
      const issuePath = issue?.path?.length
        ? `${issue.path.join(".")}: `
        : "";

      return {
        error:
          issue
            ? `${issuePath}${issue.message}`
            : "resume.yaml does not match the expected schema.",
        success: false as const,
      };
    }

    return {
      data: result.data,
      success: true as const,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "resume.yaml could not be parsed.",
      success: false as const,
    };
  }
}

export function collectResumeMarkdownPaths(raw: RawResumeDocument) {
  const paths = new Set<string>();

  const addSource = (value?: z.infer<typeof textSourceSchema>) => {
    if (!value || !isMarkdownSource(value)) {
      return;
    }

    if (typeof value.markdown === "string") {
      paths.add(normalizeContentPath(value.markdown));
      return;
    }

    if (value.markdown.ko) {
      paths.add(normalizeContentPath(value.markdown.ko));
    }
    if (value.markdown.en) {
      paths.add(normalizeContentPath(value.markdown.en));
    }
  };

  addSource(raw.summary);
  raw.experience?.forEach((item) => addSource(item.detailsMarkdown));
  raw.projects?.forEach((item) => addSource(item.detailsMarkdown));
  raw.education?.forEach((item) => {
    if ("detailsMarkdown" in item) {
      addSource(item.detailsMarkdown);
    }
  });
  raw.customSections?.forEach((section) =>
    section.items?.forEach((item) => {
      if ("detailsMarkdown" in item) {
        addSource(item.detailsMarkdown);
      }
    }),
  );

  return [...paths];
}

export function buildResumeDocument(
  raw: RawResumeDocument,
  options: BuildResumeDocumentOptions,
): ResumeDocumentData {
  const repoCatalog = new Map(
    options.repoCatalog.map((repo) => [repo.name.toLowerCase(), repo] as const),
  );

  const resumeDocument: ResumeDocumentData = {
    basics: {
      avatarPath: raw.basics.avatar
        ? normalizeAssetPath(raw.basics.avatar)
        : undefined,
      avatarUrl: raw.basics.avatarUrl,
      email: raw.basics.email,
      headline: raw.basics.headline
        ? pickLocalizedText(raw.basics.headline, options.locale)
        : undefined,
      links: (raw.basics.links ?? []).map((link) =>
        normalizeLink(link, options.locale),
      ),
      location: raw.basics.location
        ? pickLocalizedText(raw.basics.location, options.locale)
        : undefined,
      name: pickLocalizedText(raw.basics.name, options.locale),
      phone: raw.basics.phone,
      website: raw.basics.website,
    },
    customSections: (raw.customSections ?? []).map((section, index) => {
      const title = pickLocalizedText(section.title, options.locale);

      return {
        id: section.id ?? toSectionId(title, `custom-section-${index + 1}`),
        items: (section.items ?? []).map((item) =>
          normalizeCustomSectionItem(item, options.locale, options.contentFiles),
        ),
        layout: section.layout ?? "list",
        title,
      };
    }),
    education: sortResumeEntries(
      (raw.education ?? []).map((item) =>
        normalizeEducationEntry(item, options.locale, options.contentFiles),
      ),
    ),
    experience: sortResumeEntries(
      (raw.experience ?? []).map((item) =>
        normalizeEntry(item, options.locale, options.contentFiles),
      ),
    ),
    allProjects: [],
    projects: [],
    skills: normalizeSkills(raw.skills, options.locale),
    source: {
      repoName: "resume",
      repoUrl: options.repoUrl,
      updatedAt: options.updatedAt,
      visibility: options.visibility,
    },
    summary: readOptionalTextSource(
      raw.summary,
      options.locale,
      options.contentFiles,
    ),
  };

  const explicitProjects = linkProjectsToExperience(
    sortResumeEntries(
      (raw.projects ?? []).map((item) =>
        normalizeProject(
          item,
          options.locale,
          options.contentFiles,
          options.username,
          repoCatalog,
        ),
      ),
    ),
    resumeDocument.experience,
  );
  const featuredProjects = linkProjectsToExperience(
    sortResumeEntries(
      resolveFeaturedProjects(
        raw.featuredProjects,
        explicitProjects,
        options.locale,
        options.username,
        repoCatalog,
      ),
    ),
    resumeDocument.experience,
  );

  resumeDocument.allProjects = explicitProjects;
  resumeDocument.projects = featuredProjects;

  return resumeDocument;
}

export function parseResumeMarkdown(markdown: string): ResumeMarkdownBlock[] {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
  const blocks: ResumeMarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }
    blocks.push({
      text: stripInlineMarkdown(paragraphLines.join(" ").trim()),
      type: "paragraph",
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    blocks.push({
      items: listItems.map((item) => stripInlineMarkdown(item)),
      type: "list",
    });
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        text: stripInlineMarkdown(headingMatch[1]),
        type: "heading",
      });
      return;
    }

    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    paragraphLines.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks.filter((block) =>
    block.type === "list" ? block.items.length > 0 : Boolean(block.text),
  );
}

export function stripInlineMarkdown(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatResumeDateRange(
  start: string | undefined,
  end: string | undefined,
  isCurrent: boolean,
  locale: Locale,
) {
  const formatLabel = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      year: "numeric",
    }).format(parsed);
  };

  const startLabel = start ? formatLabel(start) : undefined;
  const endLabel = isCurrent
    ? locale === "ko"
      ? "현재"
      : "Present"
    : end
      ? formatLabel(end)
      : undefined;

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }
  if (startLabel) {
    return startLabel;
  }
  if (endLabel) {
    return endLabel;
  }
  return undefined;
}
