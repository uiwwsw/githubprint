import type { ResumeDocumentData } from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

export type ShowcaseSlug = "uiwwsw";

export type ShowcaseRecord = {
  createdAt: string;
  keywords: Record<Locale, string[]>;
  lede: Record<Locale, string>;
  location: Record<Locale, string>;
  name: string;
  publicResumeAssetPaths: string[];
  resumeRepoUrl: string;
  sameAs: string[];
  seoDescription: Record<Locale, string>;
  seoTitle: Record<Locale, string>;
  skills: string[];
  username: string;
};

const SHOWCASE_DEFAULT_IMAGE_PATH = "/apple-touch-icon.png";

const showcaseRecords: Record<ShowcaseSlug, ShowcaseRecord> = {
  uiwwsw: {
    createdAt: "2026-03-23",
    keywords: {
      ko: [
        "윤창원",
        "uiwwsw",
        "윤창원 이력서",
        "윤창원 프론트엔드개발자",
        "프론트엔드 개발자",
        "프론트엔드개발자",
        "React 개발자",
        "Next.js 개발자",
        "TypeScript 개발자",
        "서울 프론트엔드 개발자",
        "GitHubPrint",
      ],
      en: [
        "uiwwsw",
        "윤창원",
        "uiwwsw resume",
        "uiwwsw frontend engineer",
        "frontend engineer",
        "frontend developer",
        "React developer",
        "Next.js developer",
        "TypeScript engineer",
        "Seoul frontend engineer",
        "GitHubPrint",
      ],
    },
    lede: {
      ko: "서울 기반의 프론트엔드 개발자 윤창원의 공개 이력서입니다. React, Next.js, TypeScript, Vue, Nuxt.js 중심으로 제품 화면과 운영용 어드민, 구조 설계, 팀 개발 기준을 만들어 왔습니다.",
      en: "This is the public resume for uiwwsw, a Seoul-based frontend engineer. The work centers on React, Next.js, TypeScript, Vue, and Nuxt.js across product surfaces, admin tools, architecture, and team-wide frontend standards.",
    },
    location: {
      ko: "서울",
      en: "Seoul",
    },
    name: "윤창원",
    publicResumeAssetPaths: ["assets/profile.png"],
    resumeRepoUrl: "https://github.com/uiwwsw/resume",
    sameAs: [
      "https://github.com/uiwwsw",
      "https://uiwwsw.github.io",
      "https://githubprint.vercel.app",
    ],
    seoDescription: {
      ko: "프론트엔드 개발자 윤창원(uiwwsw)의 공개 이력서입니다. 최신 기술 스택과 공개 프로젝트를 실제 Resume 레이아웃으로 확인할 수 있습니다.",
      en: "Public resume for frontend engineer uiwwsw, featuring current technical skills and public projects in the live GitHubPrint Resume layout.",
    },
    seoTitle: {
      ko: "프론트엔드개발자 윤창원 이력서와 작업 사례 | GitHubPrint",
      en: "uiwwsw Frontend Engineer Resume | Frontend Developer Showcase | GitHubPrint",
    },
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "Vue.js",
      "Nuxt.js",
      "SWR",
      "React Query",
      "Tailwind CSS",
      "Monorepo",
    ],
    username: "uiwwsw",
  },
};

export function getShowcaseRecord(slug: ShowcaseSlug) {
  return showcaseRecords[slug];
}

export function getShowcaseRecordByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return (
    Object.values(showcaseRecords).find(
      (record) => record.username.toLowerCase() === normalizedUsername,
    ) ?? null
  );
}

export function getShowcasePath(slug: ShowcaseSlug, locale: Locale) {
  void slug;
  return locale === "en" ? "/en/showcase" : "/showcase";
}

export function getShowcaseDisplayName(
  slug: ShowcaseSlug,
  resume?: ResumeDocumentData | null,
) {
  return resume?.basics.name ?? getShowcaseRecord(slug).name;
}

export function getShowcaseProfileImage(
  slug: ShowcaseSlug,
  resume?: ResumeDocumentData | null,
) {
  void slug;
  return resume?.basics.avatarUrl ?? SHOWCASE_DEFAULT_IMAGE_PATH;
}

export function getShowcaseLocation(
  slug: ShowcaseSlug,
  locale: Locale,
  resume?: ResumeDocumentData | null,
) {
  return resume?.basics.location ?? getShowcaseRecord(slug).location[locale];
}

export function getShowcaseSkills(
  slug: ShowcaseSlug,
  resume?: ResumeDocumentData | null,
) {
  const resumeSkills = [
    ...new Set(
      resume?.skills.flatMap((group) => group.items).filter(Boolean) ?? [],
    ),
  ].slice(0, 9);

  if (resumeSkills.length > 0) {
    return resumeSkills;
  }

  return getShowcaseRecord(slug).skills;
}

export function getShowcaseSeoTitle(
  slug: ShowcaseSlug,
  locale: Locale,
  resume?: ResumeDocumentData | null,
) {
  const fallback = getShowcaseRecord(slug).seoTitle[locale];
  const name = resume?.basics.name?.trim();

  if (!name) {
    return fallback;
  }

  return locale === "ko"
    ? `${name} 프론트엔드 개발자 공개 이력서 | GitHubPrint`
    : `${name} Frontend Engineer Public Resume | GitHubPrint`;
}

function truncateSeoDescription(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const truncated = lastSpace >= maxLength * 0.7
    ? sliced.slice(0, lastSpace)
    : sliced;

  return `${truncated.trimEnd()}…`;
}

export function getShowcaseSeoDescription(
  slug: ShowcaseSlug,
  locale: Locale,
  resume?: ResumeDocumentData | null,
) {
  const showcase = getShowcaseRecord(slug);
  const name = getShowcaseDisplayName(slug, resume);
  const headline = resume?.basics.headline?.trim();
  const skills = getShowcaseSkills(slug, resume).slice(0, 4).join(", ");

  if (!resume) {
    return showcase.seoDescription[locale];
  }

  const description = locale === "ko"
    ? `${name}의 공개 개발자 이력서입니다. ${headline ? `${headline}. ` : ""}${skills ? `${skills} 기술 스택과 ` : ""}공개 프로젝트를 확인할 수 있습니다.`
    : `Public developer resume for ${name}. ${headline ? `${headline}. ` : ""}${skills ? `Explore ${skills} skills and ` : "Explore "}public projects.`;

  return truncateSeoDescription(description);
}

export function getShowcaseKeywords(
  slug: ShowcaseSlug,
  locale: Locale,
  resume?: ResumeDocumentData | null,
) {
  const showcase = getShowcaseRecord(slug);
  const skills = getShowcaseSkills(slug, resume);
  const headline = resume?.basics.headline?.trim();
  const base = [
    getShowcaseDisplayName(slug, resume),
    showcase.username,
    headline,
    ...skills.slice(0, 5),
    locale === "ko" ? "공개 이력서" : "public resume",
    "GitHubPrint",
  ].filter(Boolean) as string[];

  return [...new Set(base)];
}
