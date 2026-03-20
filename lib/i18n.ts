import type { Locale, TemplateId } from "@/lib/schemas";
import { localeSchema, templateSchema } from "@/lib/schemas";

export const defaultLocale: Locale = "ko";

type LocalizedPathname = "/" | "/result" | `/result/${TemplateId}`;

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
    authEyebrow: string;
    authTitle: string;
    authDescription: string;
    authReadyEyebrow: string;
    authReadyMessage: string;
    authSignIn: string;
    authSignOut: string;
    authSignedInAs: string;
    generatorTitle: string;
    generatorDescription: string;
    privateToggleLabel: string;
    privateToggleHint: string;
    privateToggleWarning: string;
    templateHeading: string;
    templateHint: string;
    selected: string;
    select: string;
    submit: string;
    submitting: string;
    submitHint: string;
    dataScopeTitle: string;
    dataScopeItems: {
      profile: string;
      repositories: string;
      limits: string;
    };
    signedInDataScopeItems: {
      profile: string;
      repositories: string;
      limits: string;
    };
  };
  result: {
    templateLabel: string;
    modeLabel: string;
    dataModeLabel: string;
    dataModePublic: string;
    dataModePrivate: string;
    privateExposureLabel: string;
    privateExposureAggregate: string;
    privateExposureInclude: string;
    modeAi: string;
    modeFallback: string;
    download: string;
    loadingEyebrow: string;
    loadingMessage: string;
    stateStatusLabel: string;
    stateStatusValue: string;
    stateEyebrow: string;
    backToTemplate: string;
    backHome: string;
  };
  errors: {
    authRequiredTitle: string;
    authRequiredMessage: string;
    invalidSearchTitle: string;
    invalidSearchMessage: string;
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
    factContributionsYear: string;
    factCommitsYear: string;
    factPullRequestsYear: string;
    factIssuesYear: string;
    factAuthorizedRepos: string;
    factPrivateRepos: string;
    factRecentPrivateRepos: string;
    factDocumentedPrivateRepos: string;
    factVerifiedPrivateRepos: string;
    factAutomatedPrivateRepos: string;
    benchmarkOverall: string;
    confidenceLabel: string;
    cohortLabel: string;
    repoUnit: string;
    followerUnit: string;
    privateInsightsTitle: string;
    privateInsightsHint: string;
    privateInsightsTopStack: string;
    privateInsightsAdditionalStack: string;
    privateInsightsTopSurfaces: string;
    privateInsightsTopDomains: string;
    privateInsightsShowcase: string;
    privateInsightsShowcaseHint: string;
    signedInActivityTitle: string;
    signedInActivityHint: string;
    signedInActivityWindow: string;
    sampleSizeLabel: string;
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
        benchmark: string;
        bestFit: string;
        evidence: string;
        dataScope: string;
        source: string;
        activity: string;
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
          benchmark: string;
          strengths: string;
          bestFit: string;
          evidence: string;
          dataScope: string;
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
          benchmark: string;
          dataScope: string;
          tech: string;
        };
      };
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  ko: {
    siteName: "GitHubPrint",
    htmlLang: "ko",
    language: {
      switchLabel: "언어 변경",
      ko: "KO",
      en: "EN",
    },
    metadata: {
      homeTitle: "GitHubPrint | GitHub를 전달 가능한 개발자 문서로",
      homeDescription:
        "로그인한 본인 GitHub 계정을 바탕으로 한국어 또는 영어 개발자 문서를 만드는 GitHubPrint.",
      homeKeywords: [
        "GitHubPrint",
        "GitHub 포트폴리오",
        "개발자 프로필 생성기",
        "GitHub PDF",
        "developer profile PDF",
      ],
      resultTitle: "GitHubPrint 결과 문서",
      resultDescription:
        "GitHub 데이터를 바탕으로 정리한 개발자 문서 미리보기.",
    },
    home: {
      eyebrow: "GitHubPrint",
      titleTop: "GitHub를",
      titleBottom: "전달 가능한 개발자 문서로",
      description:
        "GitHub로 로그인하면 내 계정을 바로 읽기 쉬운 개발자 문서로 변환합니다.",
      authEyebrow: "로그인 모드",
      authTitle: "GitHub 로그인으로 내 프로필 바로 만들기",
      authDescription:
        "로그인하면 GitHubPrint가 본인 계정을 바로 문서로 만들고, 승인된 GitHub 데이터 범위 안에서 비공개 저장소와 비공개 프로필 신호까지 함께 읽을 수 있습니다.",
      authReadyEyebrow: "Signed-in self mode",
      authReadyMessage:
        "아래에서 템플릿과 비공개 포함 범위를 고른 뒤 본인 프로필 결과를 생성할 수 있습니다.",
      authSignIn: "GitHub로 로그인",
      authSignOut: "로그아웃",
      authSignedInAs: "로그인됨",
      generatorTitle: "문서 템플릿과 비공개 포함 범위 선택",
      generatorDescription:
        "기본값은 비공개 저장소 상세를 숨기는 공유용 문서입니다. 토글을 켜면 비공개 저장소 이름과 설명도 결과에 직접 포함할 수 있습니다.",
      privateToggleLabel: "비공개 저장소 포함하기",
      privateToggleHint:
        "끄면 비공개 저장소는 집계형 신호로만 반영되고, 이름과 링크는 결과에 노출되지 않습니다.",
      privateToggleWarning:
        "켜면 비공개 저장소 이름, 설명, 링크가 문서와 PDF에 직접 포함될 수 있습니다.",
      templateHeading: "문서 템플릿 선택",
      templateHint: "같은 공개 정보를 바탕으로 하되, 템플릿마다 강조점과 읽는 방식이 다릅니다.",
      selected: "선택됨",
      select: "선택",
      submit: "문서 생성",
      submitting: "문서 생성 중...",
      submitHint:
        "템플릿과 비공개 포함 범위를 선택한 뒤 바로 문서를 만들 수 있습니다.",
      dataScopeTitle: "분석에 반영하는 GitHub 데이터 범위",
      dataScopeItems: {
        profile:
          "프로필 이름, 자기소개, 팔로워 수, 공개 저장소 수 같은 공개 계정 정보",
        repositories:
          "공개 저장소의 설명, README, topic, star 수, 최근 업데이트, 홈페이지, 일부 루트 파일, 최근 커밋 메시지",
        limits:
          "비공개 저장소나 GitHub 밖 정보는 보지 않으며, 경력·협업 능력·비즈니스 성과는 단정하지 않습니다.",
      },
      signedInDataScopeItems: {
        profile:
          "로그인한 본인 계정인 경우, 승인된 범위 안에서 프로필 필드와 일부 비공개 사용자 정보까지 함께 읽을 수 있습니다.",
        repositories:
          "본인이 소유한 저장소는 공개/비공개를 함께 읽을 수 있으며, README, topic, 최근 업데이트, 일부 루트 파일, 최근 커밋 메시지를 반영합니다.",
        limits:
          "로그인 모드는 본인 계정 생성에만 적용하며, GitHub 밖 정보와 경력·협업 능력·비즈니스 성과는 여전히 단정하지 않습니다.",
      },
    },
    result: {
      templateLabel: "템플릿",
      modeLabel: "모드",
      dataModeLabel: "데이터 범위",
      dataModePublic: "공개 GitHub",
      dataModePrivate: "로그인한 본인 계정",
      privateExposureLabel: "비공개 상세",
      privateExposureAggregate: "기본 공유 모드",
      privateExposureInclude: "비공개 상세 포함",
      modeAi: "AI 분석",
      modeFallback: "기본 요약 모드",
      download: "다운로드",
      loadingEyebrow: "결과 미리보기",
      loadingMessage: "GitHub 정보를 바탕으로 문서 미리보기를 만드는 중입니다.",
      stateStatusLabel: "상태",
      stateStatusValue: "생성 불가",
      stateEyebrow: "결과 문서",
      backToTemplate: "템플릿 다시 선택",
      backHome: "홈으로 돌아가기",
    },
    errors: {
      authRequiredTitle: "로그인이 필요합니다",
      authRequiredMessage:
        "결과 문서는 로그인한 본인 계정 기준으로만 생성합니다. 홈으로 돌아가 GitHub로 로그인해 주세요.",
      invalidSearchTitle: "입력 정보가 올바르지 않습니다",
      invalidSearchMessage: "템플릿 값을 다시 확인한 뒤 다시 시도해 주세요.",
      notFoundTitle: "GitHub 계정을 찾지 못했습니다",
      notFoundMessage:
        "로그인한 GitHub 계정 정보를 다시 확인한 뒤 다시 로그인해 주세요.",
      organizationTitle: "조직 계정은 아직 지원하지 않습니다",
      organizationMessage:
        "GitHubPrint는 개인 개발자 계정만 문서로 요약합니다.",
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
      factContributionsYear: "최근 1년 기여",
      factCommitsYear: "최근 1년 커밋",
      factPullRequestsYear: "최근 1년 PR",
      factIssuesYear: "최근 1년 이슈",
      factAuthorizedRepos: "읽은 전체 저장소",
      factPrivateRepos: "비공개 저장소",
      factRecentPrivateRepos: "최근 비공개 업데이트",
      factDocumentedPrivateRepos: "문서 흔적 있는 비공개",
      factVerifiedPrivateRepos: "검증 흔적 있는 비공개",
      factAutomatedPrivateRepos: "자동화 흔적 있는 비공개",
      benchmarkOverall: "유사한 개발자군 비교",
      confidenceLabel: "분석 신뢰도",
      cohortLabel: "비교 집단",
      repoUnit: "개",
      followerUnit: "명",
      privateInsightsTitle: "승인된 비공개 저장소 신호",
      privateInsightsHint:
        "로그인한 본인 계정에서만 계산되는 비공개 저장소 집계 신호입니다. 공개 결과와 달라지는 추가 스택, 작업 표면, 검증/자동화 흔적을 보수적으로 요약합니다.",
      privateInsightsTopStack: "비공개 쪽에서 추가로 보이는 스택",
      privateInsightsAdditionalStack: "공개 결과에 덜 드러난 추가 스택",
      privateInsightsTopSurfaces: "비공개 쪽에서 더 선명한 작업 표면",
      privateInsightsTopDomains: "비공개 쪽에서 더 선명한 도메인",
      privateInsightsShowcase: "비공개 하이라이트 저장소",
      privateInsightsShowcaseHint:
        "비공개 상세 포함 모드에서만 이름과 설명을 직접 노출합니다.",
      signedInActivityTitle: "승인된 활동 스냅샷",
      signedInActivityHint:
        "로그인한 본인 계정일 때만 읽을 수 있는 최근 1년 GitHub 활동 통계입니다.",
      signedInActivityWindow: "기준 기간",
      sampleSizeLabel: "표본 수",
      noProjects: "대표 프로젝트로 볼 만한 공개 저장소가 충분하지 않습니다.",
      repoLink: "저장소 링크",
      liveLink: "서비스 링크",
      githubProfile: "GitHub 프로필",
      starsLabel: "스타",
    },
    templateMeta: {
      brief: {
        label: "Brief",
        shortLabel: "스냅샷",
        description: "공개 GitHub에서 확인되는 사실을 짧고 선명하게 정리한 문서",
        emphasis: "핵심 기술, 대표 프로젝트, 최근 활동을 빠르게 훑기 좋습니다.",
      },
      profile: {
        label: "Profile",
        shortLabel: "기본형",
        description: "가장 무난하고 전달력이 좋은 기본 문서",
        emphasis: "요약, 개발자 유형, 작업 방식, 근거가 균형 있게 담깁니다.",
      },
      insight: {
        label: "Insight",
        shortLabel: "내러티브",
        description: "프로젝트 흐름과 작업 성향을 글 중심으로 풀어낸 리포트",
        emphasis: "반복 패턴, 프로젝트 읽기, 해석 맥락을 더 깊게 보여줍니다.",
      },
    },
    templates: {
      brief: {
        ribbonTemplate: "템플릿",
        ribbonGenerated: "생성일",
        ribbonSource: "분석",
        ribbonOpenAi: "AI 분석",
        ribbonFallback: "기본 요약",
        eyebrow: "GitHubPrint Brief",
        sections: {
          summary: "빠른 요약",
          strengths: "확인된 특징",
          projects: "대표 프로젝트",
          type: "개발자 유형",
          workingStyle: "작업 방식",
          benchmark: "벤치마크 스냅샷",
          bestFit: "어울리는 역할",
          evidence: "판단 근거",
          dataScope: "분석에 반영한 GitHub 데이터",
          source: "참고 링크",
          activity: "최근 활동",
        },
      },
      profile: {
        ribbonTemplate: "템플릿",
        ribbonGenerated: "생성일",
        ribbonMode: "분석",
        ribbonOpenAi: "AI 분석",
        ribbonFallback: "기본 요약",
        eyebrow: "GitHubPrint Profile",
        sections: {
          type: "개발자 유형",
          workingStyle: "작업 방식",
          projects: "대표 프로젝트",
          tech: "핵심 기술",
          benchmark: "유사한 개발자군 기준",
          strengths: "대표 강점",
          bestFit: "어울리는 역할",
          evidence: "판단 근거",
          dataScope: "분석에 반영한 GitHub 데이터",
          caution: "해석 시 유의할 점",
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
          type: "핵심 해석",
          workingStyle: "반복적으로 보이는 패턴",
          fit: "강점과 역할 해석",
          strengths: "대표 강점",
          roles: "어울리는 역할",
          projectReading: "프로젝트 읽기",
          evidence: "판단 근거",
          benchmark: "벤치마크 해석",
          dataScope: "분석에 반영한 GitHub 데이터 범위",
          tech: "기술 흐름",
        },
      },
    },
  },
  en: {
    siteName: "GitHubPrint",
    htmlLang: "en",
    language: {
      switchLabel: "Change language",
      ko: "KO",
      en: "EN",
    },
    metadata: {
      homeTitle: "GitHubPrint | Turn GitHub into a shareable developer document",
      homeDescription:
        "GitHubPrint turns your signed-in GitHub account into a polished developer document in Korean or English.",
      homeKeywords: [
        "GitHubPrint",
        "GitHub portfolio",
        "developer profile generator",
        "GitHub PDF",
        "developer document",
      ],
      resultTitle: "GitHubPrint Result Document",
      resultDescription:
        "Preview a developer document generated from GitHub signals.",
    },
    home: {
      eyebrow: "GitHubPrint",
      titleTop: "Turn GitHub",
      titleBottom: "into a shareable developer document",
      description:
        "Sign in with GitHub and turn your own account into a polished developer document right away.",
      authEyebrow: "Signed-in mode",
      authTitle: "Sign in with GitHub and generate your profile right away",
      authDescription:
        "When you sign in, GitHubPrint can immediately generate your own document using the GitHub data you authorized, including private repositories and private profile signals.",
      authReadyEyebrow: "Signed-in self mode",
      authReadyMessage:
        "Choose the template and private exposure below, then generate your own profile document.",
      authSignIn: "Sign in with GitHub",
      authSignOut: "Sign out",
      authSignedInAs: "Signed in as",
      generatorTitle: "Choose the template and private-repo exposure",
      generatorDescription:
        "The default is a shareable document that keeps private repository details hidden. Turn the toggle on only if you want private repository names and descriptions to appear directly in the result.",
      privateToggleLabel: "Include private repositories",
      privateToggleHint:
        "When off, private repositories contribute only through aggregated signals and their names or links stay hidden in the result.",
      privateToggleWarning:
        "When on, private repository names, descriptions, and links may appear directly in the document and exported PDF.",
      templateHeading: "Choose a document template",
      templateHint: "Templates use the same evidence, but differ in emphasis and reading style.",
      selected: "Selected",
      select: "Select",
      submit: "Convert",
      submitting: "Converting...",
      submitHint:
        "Choose the template and private-repo exposure, then generate the document right away.",
      dataScopeTitle: "GitHub data used",
      dataScopeItems: {
        profile:
          "Public account fields such as name, bio, followers, and public repository count",
        repositories:
          "Public repository description, README, topics, stars, update recency, homepage, some root files, and recent commit messages",
        limits:
          "Private repositories and off-GitHub data are not read, and tenure, collaboration quality, or business impact are not asserted.",
      },
      signedInDataScopeItems: {
        profile:
          "For the signed-in user's own account, authorized profile fields and some private user details may also be included.",
        repositories:
          "Owned repositories can be read across public and private visibility, including README, topics, update recency, some root files, and recent commit messages.",
        limits:
          "Signed-in mode applies only to the signed-in user's own account. Off-GitHub data, tenure, collaboration quality, and business impact are still not asserted.",
      },
    },
    result: {
      templateLabel: "Template",
      modeLabel: "Mode",
      dataModeLabel: "Data",
      dataModePublic: "Public GitHub",
      dataModePrivate: "Signed-in self mode",
      privateExposureLabel: "Private detail",
      privateExposureAggregate: "Default sharing mode",
      privateExposureInclude: "Private details included",
      modeAi: "AI analysis",
      modeFallback: "Fallback summary",
      download: "Download",
      loadingEyebrow: "Result Preview",
      loadingMessage: "Reading GitHub data and generating the document preview.",
      stateStatusLabel: "Status",
      stateStatusValue: "Unavailable",
      stateEyebrow: "GitHubPrint Result",
      backToTemplate: "Choose another template",
      backHome: "Back to home",
    },
    errors: {
      authRequiredTitle: "Sign-in required",
      authRequiredMessage:
        "Result documents are generated only for the signed-in user's own account. Go back home and sign in with GitHub.",
      invalidSearchTitle: "The input is not valid",
      invalidSearchMessage: "Please check the template selection and try again.",
      notFoundTitle: "GitHub account not found",
      notFoundMessage:
        "Please verify the signed-in GitHub account and sign in again.",
      organizationTitle: "Organization accounts are not supported yet",
      organizationMessage:
        "GitHubPrint currently summarizes individual developer accounts only.",
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
      factContributionsYear: "12m contributions",
      factCommitsYear: "12m commits",
      factPullRequestsYear: "12m PRs",
      factIssuesYear: "12m issues",
      factAuthorizedRepos: "Authorized repos",
      factPrivateRepos: "Private repos",
      factRecentPrivateRepos: "Recent private updates",
      factDocumentedPrivateRepos: "Documented private repos",
      factVerifiedPrivateRepos: "Verified private repos",
      factAutomatedPrivateRepos: "Automated private repos",
      benchmarkOverall: "Peer benchmark",
      confidenceLabel: "Confidence",
      cohortLabel: "Cohort",
      repoUnit: "",
      followerUnit: "",
      privateInsightsTitle: "Authorized private-repo signals",
      privateInsightsHint:
        "These aggregate private-repository signals are calculated only for the signed-in user's own account. They summarize added stack, surface, validation, and automation signals conservatively.",
      privateInsightsTopStack: "Additional stack signals from private work",
      privateInsightsAdditionalStack: "Stack that is less visible in public work",
      privateInsightsTopSurfaces: "Work surfaces that become clearer in private work",
      privateInsightsTopDomains: "Domains that become clearer in private work",
      privateInsightsShowcase: "Private highlights",
      privateInsightsShowcaseHint:
        "Names and descriptions appear only when private details are explicitly included.",
      signedInActivityTitle: "Authorized activity snapshot",
      signedInActivityHint:
        "These last-12-month GitHub activity counts are available only for the signed-in user's own account.",
      signedInActivityWindow: "Window",
      sampleSizeLabel: "Sample size",
      noProjects: "There are not enough public repository signals to interpret standout projects.",
      repoLink: "GitHub repo",
      liveLink: "Live link",
      githubProfile: "GitHub profile",
      starsLabel: "stars",
    },
    templateMeta: {
      brief: {
        label: "Brief",
        shortLabel: "Snapshot",
        description: "A fact-first document built for quick scanning.",
        emphasis: "Optimized for verified signals, selected projects, and recent activity.",
      },
      profile: {
        label: "Profile",
        shortLabel: "Balanced",
        description: "The default document with the best overall balance.",
        emphasis: "Combines summary, developer type, working style, and evidence in one view.",
      },
      insight: {
        label: "Insight",
        shortLabel: "Narrative",
        description: "A prose-led report that reads the profile in context.",
        emphasis: "Gives more room to recurring patterns, project reading, and interpretation.",
      },
    },
    templates: {
      brief: {
        ribbonTemplate: "Template",
        ribbonGenerated: "Generated",
        ribbonSource: "Analysis",
        ribbonOpenAi: "AI analysis",
        ribbonFallback: "Fallback summary",
        eyebrow: "GitHubPrint Brief",
        sections: {
          summary: "Quick summary",
          strengths: "Confirmed signals",
          projects: "Selected projects",
          type: "Developer type",
          workingStyle: "Working style",
          benchmark: "Benchmark snapshot",
          bestFit: "Best-fit roles",
          evidence: "Evidence",
          dataScope: "GitHub data used",
          source: "Reference link",
          activity: "Recent activity",
        },
      },
      profile: {
        ribbonTemplate: "Template",
        ribbonGenerated: "Generated",
        ribbonMode: "Analysis",
        ribbonOpenAi: "AI analysis",
        ribbonFallback: "Fallback summary",
        eyebrow: "GitHubPrint Profile",
        sections: {
          type: "Developer type",
          workingStyle: "Working style",
          projects: "Selected projects",
          tech: "Core stack",
          benchmark: "Peer benchmark",
          strengths: "Key strengths",
          bestFit: "Best-fit roles",
          evidence: "Evidence",
          dataScope: "GitHub data used",
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
          type: "Core reading",
          workingStyle: "Recurring patterns",
          fit: "Strengths and role fit",
          strengths: "Key strengths",
          roles: "Best-fit roles",
          projectReading: "Project reading",
          evidence: "Evidence",
          benchmark: "Benchmark reading",
          dataScope: "GitHub data used",
          tech: "Technology throughline",
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
  pathname: LocalizedPathname,
  locale: Locale,
) {
  if (locale === "en") {
    return pathname === "/" ? "/en" : `/en${pathname}`;
  }

  return pathname;
}

export function getLocalizedResultPath(template: TemplateId, locale: Locale) {
  return getLocalizedPathname(`/result/${template}`, locale);
}

export function getResultTemplateFromPathname(pathname: string): TemplateId | null {
  const normalizedPathname =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  const match = normalizedPathname.match(/^\/result\/([^/]+)$/);

  if (!match) {
    return null;
  }

  const template = templateSchema.safeParse(match[1]);
  return template.success ? template.data : null;
}

export function detectLocaleFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko";
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
