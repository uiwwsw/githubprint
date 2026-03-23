import type { Locale } from "@/lib/schemas";

export type ShowcaseSlug = "uiwwsw";

type ShowcaseProject = {
  description: Record<Locale, string>;
  liveUrl: string;
  repoUrl: string;
  tech: string[];
  title: string;
};

type ShowcaseExperience = {
  bullets: Record<Locale, string[]>;
  company: Record<Locale, string>;
  period: string;
  role: Record<Locale, string>;
};

type ShowcaseRecord = {
  careerLength: Record<Locale, string>;
  createdAt: string;
  education: Record<Locale, string>;
  experience: ShowcaseExperience[];
  focus: Record<Locale, string>;
  heroEyebrow: Record<Locale, string>;
  keywords: Record<Locale, string[]>;
  lede: Record<Locale, string>;
  location: Record<Locale, string>;
  name: string;
  profileImagePath: string;
  projects: ShowcaseProject[];
  resumeRepoUrl: string;
  sameAs: string[];
  seoDescription: Record<Locale, string>;
  seoTitle: Record<Locale, string>;
  skills: string[];
  summary: Record<Locale, string[]>;
  username: string;
};

const showcaseRecords: Record<ShowcaseSlug, ShowcaseRecord> = {
  uiwwsw: {
    careerLength: {
      ko: "9년 8개월",
      en: "9 years 8 months",
    },
    createdAt: "2026-03-23",
    education: {
      ko: "공주대학교 건축학전공(5년제) 졸업",
      en: "Graduated from Kongju National University, Architecture (5-year program)",
    },
    experience: [
      {
        company: {
          ko: "한국일보",
          en: "Hankook Ilbo",
        },
        period: "2024.07 - 2025.12",
        role: {
          ko: "프리랜서 프론트엔드 PL",
          en: "Freelance Frontend PL",
        },
        bullets: {
          ko: [
            "기사 관리 어드민과 백오피스를 설계하고 구축했습니다.",
            "Next.js, TypeScript, React Query 기반 프론트엔드 구조와 개발 기준을 정리했습니다.",
          ],
          en: [
            "Designed and built article-management admin and back-office interfaces.",
            "Established frontend structure and development standards with Next.js, TypeScript, and React Query.",
          ],
        },
      },
      {
        company: {
          ko: "주식회사세미티에스",
          en: "Semits",
        },
        period: "2023.08 - 2024.04",
        role: {
          ko: "프론트엔드개발 팀장",
          en: "Frontend Team Lead",
        },
        bullets: {
          ko: [
            "반도체 개발 장비용 클라이언트 웹서비스를 연속으로 설계하고 구축했습니다.",
            "Clean Architecture, SWR, Monorepo 기준을 팀에 정착시켰습니다.",
          ],
          en: [
            "Designed and delivered client web services for semiconductor equipment products.",
            "Set team-wide standards around Clean Architecture, SWR, and a monorepo-based workflow.",
          ],
        },
      },
      {
        company: {
          ko: "업라이즈 주식회사",
          en: "UPRISE",
        },
        period: "2020.05 - 2023.04",
        role: {
          ko: "프론트엔드개발 임시리더",
          en: "Acting Frontend Lead",
        },
        bullets: {
          ko: [
            "서비스 초기 구축부터 유지보수, 레거시 마이그레이션, 컴포넌트 라이브러리 구축까지 주도했습니다.",
            "사실상 1인 프론트엔드 체제에서도 우선순위를 정해 제품을 운영했습니다.",
          ],
          en: [
            "Led the product from initial build through maintenance, legacy migration, and component-library work.",
            "Handled frontend delivery almost as a one-person team while keeping product priorities moving.",
          ],
        },
      },
    ],
    focus: {
      ko: "React, Next.js, TypeScript 중심의 제품 UI, 어드민, 구조 설계와 팀 기준 정립",
      en: "Product UI, admin surfaces, architecture, and frontend standards built around React, Next.js, and TypeScript",
    },
    heroEyebrow: {
      ko: "공개 이력서 쇼케이스",
      en: "Public Resume Showcase",
    },
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
    profileImagePath: "/showcase/uiwwsw/profile.png",
    projects: [
      {
        title: "GitHubPrint",
        description: {
          ko: "GitHub 데이터를 공유 가능한 개발자 문서와 PDF로 정리하는 제품입니다.",
          en: "A product that turns GitHub evidence into shareable developer documents and PDFs.",
        },
        liveUrl: "https://githubprint.vercel.app",
        repoUrl: "https://github.com/uiwwsw/gitfolio",
        tech: ["Next.js", "TypeScript"],
      },
      {
        title: "YAVN",
        description: {
          ko: "라이브로 공개한 TypeScript 기반 웹 제품입니다.",
          en: "A live web product published from a TypeScript-based stack.",
        },
        liveUrl: "https://yavn.vercel.app",
        repoUrl: "https://github.com/uiwwsw/yavn",
        tech: ["TypeScript"],
      },
      {
        title: "Virtual Keyboard",
        description: {
          ko: "입력 인터랙션을 다루는 가상 키보드 실험 프로젝트입니다.",
          en: "An interaction-focused project built around virtual keyboard input.",
        },
        liveUrl: "https://composed-input.vercel.app",
        repoUrl: "https://github.com/uiwwsw/virtual-keyboard",
        tech: ["TypeScript", "React", "CSS"],
      },
      {
        title: "React Query Helper",
        description: {
          ko: "React Query 사용을 돕는 npm 패키지입니다.",
          en: "An npm package that supports React Query workflows.",
        },
        liveUrl: "https://www.npmjs.com/package/@uiwwsw/react-query-helper",
        repoUrl: "https://github.com/uiwwsw/react-query-helper",
        tech: ["TypeScript", "React Query", "CLI"],
      },
    ],
    resumeRepoUrl: "https://github.com/uiwwsw/resume",
    sameAs: [
      "https://github.com/uiwwsw",
      "https://uiwwsw.github.io",
      "https://githubprint.vercel.app",
    ],
    seoDescription: {
      ko: "프론트엔드개발자 윤창원(uiwwsw)의 공개 이력서와 작업 사례 페이지입니다. React, Next.js, TypeScript 기반 경력, 대표 프로젝트, 공개 resume 레포를 실제 Resume 레이아웃으로 확인할 수 있습니다.",
      en: "Public resume and work showcase for uiwwsw, a frontend engineer and frontend developer. Review React, Next.js, and TypeScript experience, featured projects, and the live Resume layout rendered from the public repository.",
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
    summary: {
      ko: [
        "총 경력 9년 8개월의 프론트엔드 개발자입니다.",
        "자율성과 책임이 큰 환경에서 서비스 초기 구축, 유지보수, 구조 개편, 팀 리딩을 수행해왔습니다.",
        "Next.js, Nuxt.js, React, TypeScript 기반 아키텍처 설계와 공통 개발 기준 정립을 맡아 왔고, 맡은 일을 끝까지 책임지고 결과로 연결하는 데 강점이 있습니다.",
      ],
      en: [
        "Frontend engineer with 9 years and 8 months of experience.",
        "The work has covered initial product builds, maintenance, architectural refactoring, and team leadership in high-autonomy environments.",
        "A recurring strength is building maintainable frontend systems with Next.js, Nuxt.js, React, and TypeScript, then carrying work through to concrete outcomes.",
      ],
    },
    username: "uiwwsw",
  },
};

export function getShowcaseRecord(slug: ShowcaseSlug) {
  return showcaseRecords[slug];
}

export function getShowcasePath(slug: ShowcaseSlug, locale: Locale) {
  void slug;
  return locale === "en" ? "/en/showcase" : "/showcase";
}
