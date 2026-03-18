import type { Locale, TemplateId } from "@/lib/schemas";
import { localeSchema } from "@/lib/schemas";

export const defaultLocale: Locale = "ko";

type Dictionary = {
  siteName: string;
  htmlLang: string;
  language: {
    switchLabel: string;
    ko: string;
    en: string;
  };
  metadata: {
    homeTitle: string;
    homeDescription: string;
    homeKeywords: string[];
    resultTitle: string;
    resultDescription: string;
  };
  home: {
    eyebrow: string;
    titleTop: string;
    titleBottom: string;
    description: string;
    urlLabel: string;
    urlPlaceholder: string;
    urlHintPrimary: string;
    urlHintSecondary: string;
    templateHeading: string;
    templateHint: string;
    selected: string;
    select: string;
    submit: string;
    submitting: string;
    submitHint: string;
  };
  result: {
    templateLabel: string;
    modeLabel: string;
    modeAi: string;
    modeFallback: string;
    download: string;
    loadingEyebrow: string;
    loadingMessage: string;
    stateStatusLabel: string;
    stateStatusValue: string;
    stateEyebrow: string;
    backHome: string;
  };
  errors: {
    invalidSearchTitle: string;
    invalidSearchMessage: string;
    invalidUrlTitle: string;
    notFoundTitle: string;
    notFoundMessage: string;
    organizationTitle: string;
    organizationMessage: string;
    rateLimitTitle: string;
    rateLimitMessage: string;
    rateLimitResetPrefix: string;
    fetchTitle: string;
    fetchMessage: string;
    unknownTitle: string;
    unknownMessage: string;
  };
  common: {
    factTech: string;
    factRepos: string;
    factFollowers: string;
    repoUnit: string;
    followerUnit: string;
    noProjects: string;
    repoLink: string;
    liveLink: string;
    githubProfile: string;
    starsLabel: string;
  };
  templateMeta: Record<
    TemplateId,
    {
      label: string;
      shortLabel: string;
      description: string;
      emphasis: string;
    }
  >;
  templates: {
    brief: {
      ribbonTemplate: string;
      ribbonGenerated: string;
      ribbonSource: string;
      ribbonOpenAi: string;
      ribbonFallback: string;
      eyebrow: string;
      sections: {
        summary: string;
        strengths: string;
        projects: string;
        type: string;
        workingStyle: string;
        bestFit: string;
        evidence: string;
        source: string;
      };
    };
    profile: {
      ribbonTemplate: string;
      ribbonGenerated: string;
      ribbonMode: string;
      ribbonOpenAi: string;
      ribbonFallback: string;
      eyebrow: string;
      sections: {
        type: string;
        workingStyle: string;
        projects: string;
        tech: string;
        strengths: string;
        bestFit: string;
        evidence: string;
        caution: string;
      };
    };
    insight: {
      ribbonTemplate: string;
      ribbonGenerated: string;
      ribbonProfile: string;
      ribbonMode: string;
      ribbonOpenAi: string;
      ribbonFallback: string;
      eyebrow: string;
      sections: {
        type: string;
        workingStyle: string;
        fit: string;
        strengths: string;
        roles: string;
        projectReading: string;
        evidence: string;
        tech: string;
      };
    };
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  ko: {
    siteName: "GitFolio",
    htmlLang: "ko",
    language: {
      switchLabel: "언어 변경",
      ko: "KO",
      en: "EN",
    },
    metadata: {
      homeTitle: "GitFolio | GitHub를 전달 가능한 개발자 문서로",
      homeDescription:
        "공개 GitHub URL을 한국어 또는 영어의 전달 가능한 개발자 문서로 정리하는 GitFolio MVP.",
      homeKeywords: [
        "GitFolio",
        "GitHub 포트폴리오",
        "개발자 프로필 생성기",
        "GitHub PDF",
        "developer profile PDF",
      ],
      resultTitle: "GitFolio 결과 문서",
      resultDescription:
        "GitHub 공개 데이터를 읽기 쉬운 개발자 문서로 변환한 결과 미리보기.",
    },
    home: {
      eyebrow: "GitFolio",
      titleTop: "GitHub를",
      titleBottom: "전달 가능한 개발자 문서로",
      description:
        "공개 GitHub 데이터를 읽기 쉬운 한국어 결과물로 정리합니다. 분석 데이터는 하나이고, 보여주는 방식만 템플릿별로 달라집니다.",
      urlLabel: "GitHub URL 또는 아이디",
      urlPlaceholder: "예: https://github.com/username 또는 username",
      urlHintPrimary: "profile URL, repo URL, GitHub 아이디 모두 입력할 수 있습니다.",
      urlHintSecondary: "A4 인쇄와 브라우저 PDF 저장에 맞춰 결과가 정리됩니다.",
      templateHeading: "문서 템플릿 선택",
      templateHint: "분석 데이터는 동일하고, 레이아웃만 달라집니다.",
      selected: "선택됨",
      select: "선택",
      submit: "컨버팅",
      submitting: "컨버팅 중...",
      submitHint:
        "기본 템플릿은 미리 선택되어 있으며, 유효한 URL 또는 아이디가 입력되면 바로 컨버팅할 수 있습니다.",
    },
    result: {
      templateLabel: "템플릿",
      modeLabel: "모드",
      modeAi: "AI 분석",
      modeFallback: "기본 요약 모드",
      download: "다운로드",
      loadingEyebrow: "Result Preview",
      loadingMessage: "GitHub 데이터를 읽고 문서 미리보기를 생성하는 중입니다.",
      stateStatusLabel: "상태",
      stateStatusValue: "생성 불가",
      stateEyebrow: "GitFolio Result",
      backHome: "입력 페이지로 돌아가기",
    },
    errors: {
      invalidSearchTitle: "입력 정보가 올바르지 않습니다",
      invalidSearchMessage: "GitHub URL 또는 아이디와 템플릿 값을 다시 확인해 주세요.",
      invalidUrlTitle: "입력을 다시 확인해 주세요",
      notFoundTitle: "GitHub 계정을 찾지 못했습니다",
      notFoundMessage:
        "입력한 URL 또는 아이디에서 읽은 사용자 이름으로 공개 GitHub 계정을 찾지 못했습니다.",
      organizationTitle: "조직 계정은 아직 지원하지 않습니다",
      organizationMessage:
        "GitFolio는 개인 개발자 계정을 문서로 요약하는 MVP입니다. 조직 계정 대신 개인 프로필 URL이나 아이디를 입력해 주세요.",
      rateLimitTitle: "잠시 후 다시 시도해 주세요",
      rateLimitMessage:
        "GitHub API 요청 한도에 도달했습니다. 잠시 후 다시 생성하면 정상적으로 불러올 수 있습니다.",
      rateLimitResetPrefix: "예상 재시도 가능 시점",
      fetchTitle: "GitHub 데이터를 불러오지 못했습니다",
      fetchMessage: "네트워크 상태나 요청 한도를 확인한 뒤 다시 시도해 주세요.",
      unknownTitle: "문서를 생성하지 못했습니다",
      unknownMessage: "일시적인 문제일 수 있습니다. 다시 시도해 주세요.",
    },
    common: {
      factTech: "주요 기술",
      factRepos: "공개 저장소",
      factFollowers: "팔로워",
      repoUnit: "개",
      followerUnit: "명",
      noProjects: "대표 프로젝트로 해석할 만한 공개 저장소 신호가 충분하지 않습니다.",
      repoLink: "GitHub repo",
      liveLink: "Live link",
      githubProfile: "GitHub profile",
      starsLabel: "stars",
    },
    templateMeta: {
      brief: {
        label: "Brief",
        shortLabel: "압축형",
        description: "짧고 선명하게 핵심만 전달하는 1~2페이지 스타일",
        emphasis: "요약, 강점, 대표 프로젝트를 빠르게 읽게 합니다.",
      },
      profile: {
        label: "Profile",
        shortLabel: "균형형",
        description: "가장 무난하고 전달력이 좋은 기본 문서",
        emphasis: "요약, 개발자 유형, 작업 방식, 근거의 균형이 좋습니다.",
      },
      insight: {
        label: "Insight",
        shortLabel: "해석형",
        description: "작업 패턴과 개발 성향 해석에 무게를 둔 리포트",
        emphasis: "프로젝트 해석과 기술 선택 경향을 더 깊게 보여줍니다.",
      },
    },
    templates: {
      brief: {
        ribbonTemplate: "템플릿",
        ribbonGenerated: "생성일",
        ribbonSource: "분석",
        ribbonOpenAi: "AI 분석",
        ribbonFallback: "기본 요약",
        eyebrow: "GitFolio Brief",
        sections: {
          summary: "짧은 요약",
          strengths: "핵심 강점",
          projects: "대표 프로젝트",
          type: "개발자 유형",
          workingStyle: "작업 방식",
          bestFit: "어울리는 역할",
          evidence: "판단 근거",
          source: "참고 링크",
        },
      },
      profile: {
        ribbonTemplate: "템플릿",
        ribbonGenerated: "생성일",
        ribbonMode: "분석",
        ribbonOpenAi: "AI 분석",
        ribbonFallback: "기본 요약",
        eyebrow: "GitFolio Profile",
        sections: {
          type: "개발자 유형",
          workingStyle: "작업 방식",
          projects: "대표 프로젝트",
          tech: "핵심 기술",
          strengths: "대표 강점",
          bestFit: "어울리는 역할",
          evidence: "판단 근거",
          caution: "주의해서 읽을 점",
        },
      },
      insight: {
        ribbonTemplate: "템플릿",
        ribbonGenerated: "생성일",
        ribbonProfile: "프로필",
        ribbonMode: "분석",
        ribbonOpenAi: "AI 분석",
        ribbonFallback: "기본 요약",
        eyebrow: "Interpretive Report",
        sections: {
          type: "개발자 유형 해석",
          workingStyle: "작업 방식 해석",
          fit: "강점과 적합 역할",
          strengths: "대표 강점",
          roles: "어울리는 역할",
          projectReading: "프로젝트 해석",
          evidence: "판단 근거",
          tech: "핵심 기술 분포",
        },
      },
    },
  },
  en: {
    siteName: "GitFolio",
    htmlLang: "en",
    language: {
      switchLabel: "Change language",
      ko: "KO",
      en: "EN",
    },
    metadata: {
      homeTitle: "GitFolio | Turn GitHub into a shareable developer document",
      homeDescription:
        "GitFolio turns a public GitHub URL into a polished developer document in Korean or English.",
      homeKeywords: [
        "GitFolio",
        "GitHub portfolio",
        "developer profile generator",
        "GitHub PDF",
        "developer document",
      ],
      resultTitle: "GitFolio Result Document",
      resultDescription:
        "Preview a developer document generated from public GitHub signals.",
    },
    home: {
      eyebrow: "GitFolio",
      titleTop: "Turn GitHub",
      titleBottom: "into a shareable developer document",
      description:
        "GitFolio reads public GitHub data and turns it into a polished document. The analysis stays the same while the presentation changes by template.",
      urlLabel: "GitHub URL or username",
      urlPlaceholder: "e.g. https://github.com/username or username",
      urlHintPrimary: "Profile URLs, repository URLs, and GitHub usernames are all accepted.",
      urlHintSecondary: "The result is optimized for A4 print and browser PDF export.",
      templateHeading: "Choose a document template",
      templateHint: "The analysis stays the same. Only the layout changes.",
      selected: "Selected",
      select: "Select",
      submit: "Convert",
      submitting: "Converting...",
      submitHint:
        "The default template is preselected. Convert becomes available as soon as the URL or username is valid.",
    },
    result: {
      templateLabel: "Template",
      modeLabel: "Mode",
      modeAi: "AI analysis",
      modeFallback: "Fallback summary",
      download: "Download",
      loadingEyebrow: "Result Preview",
      loadingMessage: "Reading GitHub data and generating the document preview.",
      stateStatusLabel: "Status",
      stateStatusValue: "Unavailable",
      stateEyebrow: "GitFolio Result",
      backHome: "Back to home",
    },
    errors: {
      invalidSearchTitle: "The input is not valid",
      invalidSearchMessage: "Please check the GitHub URL or username and template selection.",
      invalidUrlTitle: "Please check the input",
      notFoundTitle: "GitHub account not found",
      notFoundMessage:
        "We could not find a public GitHub account from the username extracted from the URL or input.",
      organizationTitle: "Organization accounts are not supported yet",
      organizationMessage:
        "GitFolio currently summarizes individual developer accounts. Please use a personal GitHub profile URL or username instead.",
      rateLimitTitle: "Please try again shortly",
      rateLimitMessage:
        "The GitHub API rate limit has been reached. Try generating the document again in a few minutes.",
      rateLimitResetPrefix: "Estimated reset time",
      fetchTitle: "Unable to fetch GitHub data",
      fetchMessage: "Please check your network status or GitHub API quota and try again.",
      unknownTitle: "Unable to generate the document",
      unknownMessage: "This may be a temporary issue. Please try again.",
    },
    common: {
      factTech: "Top stack",
      factRepos: "Public repos",
      factFollowers: "Followers",
      repoUnit: "",
      followerUnit: "",
      noProjects: "There are not enough public repository signals to interpret standout projects.",
      repoLink: "GitHub repo",
      liveLink: "Live link",
      githubProfile: "GitHub profile",
      starsLabel: "stars",
    },
    templateMeta: {
      brief: {
        label: "Brief",
        shortLabel: "Compressed",
        description: "A concise one to two page format focused on the essentials.",
        emphasis: "Optimized for fast understanding through summary, strengths, and standout work.",
      },
      profile: {
        label: "Profile",
        shortLabel: "Balanced",
        description: "The default document with the best overall balance.",
        emphasis: "Combines summary, developer type, working style, and evidence in one view.",
      },
      insight: {
        label: "Insight",
        shortLabel: "Interpretive",
        description: "A report-style template with more emphasis on working patterns.",
        emphasis: "Gives more room to project interpretation and recurring technical choices.",
      },
    },
    templates: {
      brief: {
        ribbonTemplate: "Template",
        ribbonGenerated: "Generated",
        ribbonSource: "Analysis",
        ribbonOpenAi: "AI analysis",
        ribbonFallback: "Fallback summary",
        eyebrow: "GitFolio Brief",
        sections: {
          summary: "Quick summary",
          strengths: "Key strengths",
          projects: "Selected projects",
          type: "Developer type",
          workingStyle: "Working style",
          bestFit: "Best-fit roles",
          evidence: "Evidence",
          source: "Reference link",
        },
      },
      profile: {
        ribbonTemplate: "Template",
        ribbonGenerated: "Generated",
        ribbonMode: "Analysis",
        ribbonOpenAi: "AI analysis",
        ribbonFallback: "Fallback summary",
        eyebrow: "GitFolio Profile",
        sections: {
          type: "Developer type",
          workingStyle: "Working style",
          projects: "Selected projects",
          tech: "Core stack",
          strengths: "Key strengths",
          bestFit: "Best-fit roles",
          evidence: "Evidence",
          caution: "Read with caution",
        },
      },
      insight: {
        ribbonTemplate: "Template",
        ribbonGenerated: "Generated",
        ribbonProfile: "Profile",
        ribbonMode: "Analysis",
        ribbonOpenAi: "AI analysis",
        ribbonFallback: "Fallback summary",
        eyebrow: "Interpretive Report",
        sections: {
          type: "Developer type interpretation",
          workingStyle: "Working style interpretation",
          fit: "Strengths and role fit",
          strengths: "Key strengths",
          roles: "Best-fit roles",
          projectReading: "Project interpretation",
          evidence: "Evidence",
          tech: "Core technology distribution",
        },
      },
    },
  },
};

export function resolveLocale(value?: string | string[] | null): Locale {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = localeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaultLocale;
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage?: string | null,
): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const normalized = acceptLanguage.toLowerCase();

  if (normalized.includes("ko")) {
    return "ko";
  }

  if (normalized.includes("en")) {
    return "en";
  }

  return defaultLocale;
}

export function getLocalizedPathname(
  pathname: "/" | "/result",
  locale: Locale,
) {
  if (locale === "en") {
    return pathname === "/" ? "/en" : `/en${pathname}`;
  }

  return pathname;
}

export function detectLocaleFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko";
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
