import type {
  ResumeDocumentData,
  ResumeEntry,
  ResumeProject,
} from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

const MASK_COPY = {
  ko: {
    experienceBullet:
      "회사명, 근무 기간, 담당 업무 등 상세 경력은 개인정보 보호를 위해 공개하지 않습니다.",
    experienceTitle: "경력 정보 비공개",
  },
  en: {
    experienceBullet:
      "Company names, employment dates, and role details are hidden for privacy.",
    experienceTitle: "Experience details withheld",
  },
} satisfies Record<Locale, Record<string, string>>;

function buildMaskedExperience(locale: Locale): ResumeEntry {
  const copy = MASK_COPY[locale];

  return {
    bullets: [copy.experienceBullet],
    current: false,
    links: [],
    title: copy.experienceTitle,
  };
}

function detachProjectFromExperience(project: ResumeProject): ResumeProject {
  return {
    ...project,
    linkedExperienceTitle: undefined,
  };
}

export function buildPublicShowcaseResumeDocument(
  document: ResumeDocumentData,
  options: {
    locale: Locale;
    username: string;
  },
): ResumeDocumentData {
  const basics = {
    ...document.basics,
    email: undefined,
    links: document.basics.links.filter((link) => link.kind !== "contact"),
    location: undefined,
    phone: undefined,
  };

  if (document.basics.avatarPath) {
    basics.avatarUrl = `/api/public-resume-asset?username=${encodeURIComponent(options.username)}&path=${encodeURIComponent(document.basics.avatarPath)}`;
    delete basics.avatarPath;
  }

  return {
    ...document,
    basics,
    experience:
      document.experience.length > 0
        ? [buildMaskedExperience(options.locale)]
        : [],
    projects: document.projects.map(detachProjectFromExperience),
    allProjects: document.allProjects.map(detachProjectFromExperience),
  };
}
