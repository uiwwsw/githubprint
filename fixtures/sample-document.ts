import { mockGitHubProfile } from "@/fixtures/mock-profile";
import { buildBenchmarkSnapshot } from "@/lib/benchmark";
import { profileEngineConfig } from "@/lib/data-loader";
import { buildRuleBasedAnalysis } from "@/lib/narrative-writer";
import { extractProfileFeatures } from "@/lib/profile-features";
import { scoreProfile } from "@/lib/rule-engine";
import type { Locale } from "@/lib/schemas";
import type { ResumeDocumentData, ResumeEntry } from "@/lib/resume";

export const SAMPLE_DATE = "2026-09-01T00:00:00.000Z";
export function buildSampleAnalysis(locale: Locale) {
  const source = structuredClone(mockGitHubProfile);
  source.account.name = locale === "ko" ? "김하늘" : "Alex Morgan";
  source.account.avatarUrl =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="20" fill="#e4eee8"/><circle cx="50" cy="37" r="16" fill="#5b846f"/><path d="M20 85c0-20 12-31 30-31s30 11 30 31" fill="#5b846f"/></svg>',
    );
  source.account.username = "example-developer";
  source.activity.note =
    locale === "ko"
      ? "최근 프로젝트에서 인터페이스 구현과 문서화 작업이 함께 확인됩니다."
      : "Recent projects include interface development and documentation.";
  if (locale === "en") {
    const descriptions: Record<string, string> = {
      "githubprint-web":
        "A Next.js app that turns GitHub profiles into shareable developer documents",
      "proto-kit": "A UI prototyping kit for testing product ideas",
      "doc-polish": "Markdown tooling for clearer product documentation",
    };
    for (const repo of [...source.repos, ...source.representativeRepos]) {
      repo.description = descriptions[repo.name] ?? repo.description;
    }
    source.evidenceSignals = [
      "The primary languages are TypeScript, MDX, and CSS.",
      "Selected repositories include documented READMEs.",
      "Some selected projects link to a demo or a homepage.",
    ];
  }
  const features = extractProfileFeatures(source, profileEngineConfig);
  const scoring = scoreProfile(source, features, profileEngineConfig, locale);
  return {
    analysis: buildRuleBasedAnalysis(
      source,
      scoring,
      profileEngineConfig,
      locale,
    ),
    benchmark: buildBenchmarkSnapshot(source, features, scoring, locale),
    mode: "fallback" as const,
  };
}

export function buildSampleResume(locale: Locale): ResumeDocumentData {
  const ko = locale === "ko";
  const entry = (
    title: string,
    subtitle: string,
    bullets: string[],
    start: string,
    end?: string,
  ): ResumeEntry => ({
    title,
    subtitle,
    bullets,
    start,
    end,
    current: !end,
    links: [],
  });
  const projects = [
    {
      ...entry(
        "GitHubPrint",
        ko
          ? "GitHub 기록을 전달 가능한 문서로"
          : "Turning GitHub work into shareable documents",
        [
          ko
            ? "GitHub 프로젝트와 활동을 템플릿별로 구성하고, 한국어와 영어로 읽을 수 있는 문서 화면을 구현했습니다."
            : "Built bilingual document views that organize GitHub projects and activity into distinct templates.",
          ko
            ? "인쇄용 레이아웃과 편집 가능한 Word 내보내기를 구현하고 문서의 페이지 나눔을 점검했습니다."
            : "Implemented print layouts and editable Word exports, with checks for document pagination.",
        ],
        "2025-10",
        "2026-08",
      ),
      tech: ["TypeScript", "Next.js", "React", "Tailwind CSS"],
      projectLabels: [],
      repoVerified: false,
      links: [
        {
          kind: "repo" as const,
          label: "GitHub",
          url: "https://github.com/example/githubprint",
        },
      ],
    },
    {
      ...entry(
        "Component Notes",
        ko
          ? "일관된 인터페이스를 위한 컴포넌트 모음"
          : "A component collection for consistent interfaces",
        [
          ko
            ? "버튼, 입력 필드, 피드백 상태를 재사용 가능한 컴포넌트로 정리하고 사용 예시를 작성했습니다."
            : "Documented reusable buttons, inputs, and feedback states with practical usage examples.",
        ],
        "2025-03",
        "2025-09",
      ),
      tech: ["React", "Storybook", "CSS"],
      projectLabels: [],
      repoVerified: false,
    },
  ];
  return {
    basics: {
      name: ko ? "김하늘" : "Alex Morgan",
      headline: ko
        ? "프론트엔드 개발자 · 제품의 작은 디테일까지"
        : "Frontend developer · Thoughtful product experiences",
      email: "hello@example.com",
      location: ko ? "서울, 대한민국" : "Seoul, South Korea",
      links: [],
    },
    summary: ko
      ? "복잡한 정보를 명확한 인터페이스로 정리하는 프론트엔드 개발자입니다. TypeScript와 React로 제품을 만들며 접근성, 재사용 가능한 컴포넌트, 문서화에 관심을 두고 있습니다."
      : "Frontend developer focused on making complex information clear. I build products with TypeScript and React, with an interest in accessibility, reusable components, and documentation.",
    experience: [
      entry(
        ko ? "스튜디오 예시" : "Example Studio",
        ko ? "프론트엔드 개발자" : "Frontend Developer",
        [
          ko
            ? "제품 대시보드의 검색과 필터 흐름을 구현하고 로딩·빈 화면·오류 상태를 정리했습니다."
            : "Implemented search and filtering for a product dashboard, including loading, empty, and error states.",
          ko
            ? "디자인 토큰과 공통 컴포넌트를 문서화하여 화면 간 일관성을 유지했습니다."
            : "Documented design tokens and shared components to maintain consistency across screens.",
        ],
        "2024-03",
      ),
    ],
    projects,
    allProjects: projects,
    education: [
      entry(
        ko ? "예시대학교" : "Example University",
        ko ? "컴퓨터공학 학사" : "BSc Computer Science",
        [],
        "2020-03",
        "2024-02",
      ),
    ],
    skills: [
      {
        title: ko ? "개발" : "Development",
        items: ["TypeScript", "JavaScript", "React", "Next.js", "HTML / CSS"],
      },
      {
        title: ko ? "도구와 품질" : "Tools & quality",
        items: ["Git", "Figma", "Playwright", "Storybook", "Accessibility"],
      },
    ],
    customSections: [],
    warnings: [],
    source: {
      repoName: "resume",
      repoUrl: "https://github.com/example/resume",
      visibility: "public",
      updatedAt: SAMPLE_DATE,
    },
  };
}
