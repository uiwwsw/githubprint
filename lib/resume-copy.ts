import type { Locale } from "@/lib/schemas";

type ResumeCopy = {
  actions: {
    downloadWord: string;
    downloadWordFailed: string;
    downloadWordPending: string;
    repoSourceLabel: string;
    repoVisibilityLabel: string;
  };
  card: {
    activationHint: string;
    lockedInvalid: string;
    lockedMissing: string;
    ready: string;
  };
  panel: {
    benefits: string[];
    benefitsTitle: string;
    close: string;
    enabledFeatures: string[];
    enabledTitle: string;
    invalidTitle: string;
    invalidMessage: string;
    invalidReasonLabel: string;
    missingTitle: string;
    missingMessage: string;
    starterTitle: string;
    stepsTitle: string;
    steps: string[];
    subtitle: string;
    title: string;
    toggleHint: string;
    togglePrivate: string;
    togglePrivateHint: string;
    togglePublic: string;
    togglePublicHint: string;
  };
  resultState: {
      invalidTitle: string;
      invalidMessage: string;
      missingTitle: string;
      missingMessage: string;
      warningTitle: string;
      warningMessage: string;
  };
  shared: {
    githubStart: string;
    independent: string;
    current: string;
    private: string;
    public: string;
    present: string;
    whileAt: string;
  };
  template: {
      emptyState: string;
      noSummary: string;
      projectProfile: string;
      projectContext: string;
      repoVerified: string;
    ribbonGenerated: string;
    ribbonSource: string;
    ribbonTemplate: string;
    ribbonVisibility: string;
    sections: {
      basics: string;
      education: string;
      experience: string;
      links: string;
      projects: string;
      skills: string;
      summary: string;
    };
  };
};

const resumeCopy: Record<Locale, ResumeCopy> = {
  ko: {
    actions: {
      downloadWord: "Word 다운로드",
      downloadWordFailed: "Word 파일을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      downloadWordPending: "Word 파일 준비 중...",
      repoSourceLabel: "소스",
      repoVisibilityLabel: "레포 공개 범위",
    },
    card: {
      activationHint:
        "Resume 템플릿은 `resume` 레포와 루트의 `resume.yaml`이 있어야 활성화되며, 영어 버전은 `resume.en.yaml`으로 분리할 수 있습니다.",
      lockedInvalid: "규격 수정 필요",
      lockedMissing: "원본 접근 확인",
      ready: "사용 가능",
    },
    panel: {
      benefits: [
        "GitHub 분석으로는 담기지 않는 전체 경력 이력과 역할 변화를 구조적으로 담을 수 있습니다.",
        "프로젝트, 경력, 교육, 링크를 Word 이력서로 바로 내보낼 수 있습니다.",
        "기본 섹션 외에 custom section으로 발표, 수상, 글, 오픈소스 활동을 확장할 수 있습니다.",
        "repo, live, docs 링크를 함께 적어 근거 링크를 이력서 안에 자연스럽게 붙일 수 있습니다.",
      ],
      benefitsTitle: "resume 레포를 두면 좋은 점",
      close: "닫기",
      enabledFeatures: [
        "같은 미리보기에서 PDF·Word(.docx)·HTML 이력서 저장",
        "경력, 프로젝트, 교육, 스킬, 커스텀 섹션 전체 표현",
        "repo/live/docs 링크를 근거 행으로 강조",
        "`resume.yaml`과 `resume.en.yaml`로 한국어/영어를 분리 관리",
      ],
      enabledTitle: "활성화되면 가능한 것",
      invalidTitle: "resume 레포는 찾았지만 규격이 아직 맞지 않습니다.",
      invalidMessage:
        "루트에 `resume.yaml`이 있어야 하고, 영어를 따로 관리하려면 `resume.en.yaml`을 추가하면 됩니다. 참조 Markdown 파일은 `content/` 아래에 있어야 합니다.",
      invalidReasonLabel: "확인된 문제",
      missingTitle: "선택한 범위에서 `resume` 원본을 찾지 못했습니다.",
      missingMessage:
        "공개 원본은 바로 사용할 수 있습니다. 비공개 원본은 홈의 Resume 설정에서 원본 접근을 허용하고 GitHub 권한을 연결하세요.",
      starterTitle: "starter 구조",
      stepsTitle: "빠른 활성화 순서",
      steps: [
        "`resume` 이름의 GitHub 레포를 만든다.",
        "루트에 `resume.yaml`을 추가한다.",
        "영문 이력서가 필요하면 `resume.en.yaml`을 추가한다.",
        "긴 요약이나 상세 설명은 `content/*.md`로 분리해 참조한다.",
        "다시 돌아와 Resume 템플릿을 선택해 자료 범위를 고르고 미리보기와 PDF·Word·HTML 저장을 연다.",
      ],
      subtitle:
        "Resume 템플릿은 GitHub 추론 문서가 아니라 사용자가 직접 관리하는 `resume` 레포를 기반으로 이력서를 만듭니다.",
      title: "Resume 템플릿 활성화",
      toggleHint:
        "원본 저장소 공개 범위는 GitHub에서 설정합니다. GitHubPrint에서는 원본 접근과 연결 프로젝트 보강을 별도로 선택합니다.",
      togglePrivate: "비공개",
      togglePrivateHint:
        "직접 작성한 연락처와 경력을 GitHub에 공개하지 않고 관리할 수 있습니다. 원본 접근을 허용하면 그 내용은 PDF·Word·HTML에 포함됩니다.",
      togglePublic: "공개",
      togglePublicHint:
        "레포 자체를 외부에 보여주기 쉽고 같은 구조를 누구나 참고할 수 있습니다.",
    },
    resultState: {
      invalidTitle: "Resume 템플릿을 아직 생성할 수 없습니다.",
      invalidMessage:
        "`resume` 레포는 있지만 `resume.yaml`, 필요한 경우 `resume.en.yaml`, 또는 참조 Markdown 규격을 먼저 맞춰야 합니다.",
      missingTitle: "선택한 범위에서 이력서 원본을 찾지 못했습니다.",
      missingMessage:
        "이미 resume 레포가 있다면 다시 만들 필요 없습니다. 비공개 레포는 아래에서 원본 접근을 허용하고, 필요한 경우 GitHub 권한을 연결한 뒤 다시 불러오세요. 레포가 없다면 준비 방법을 확인하세요.",
      warningTitle: "일부 항목은 건너뛰고 계속 생성했습니다.",
      warningMessage:
        "문서를 전체 차단하지 않고, 문제가 있는 필드나 참조만 제외했습니다. 아래 경고를 기준으로 `resume.yaml` 또는 `resume.en.yaml`을 정리하면 됩니다.",
    },
    shared: {
      githubStart: "GitHub 시작 시점",
      independent: "독립 프로젝트",
      current: "현재",
      private: "비공개",
      public: "공개",
      present: "현재",
      whileAt: "재직 시기",
    },
    template: {
      emptyState: "이 섹션에 아직 항목이 없습니다.",
      noSummary: "짧은 자기소개가 아직 없습니다.",
      projectProfile: "프로젝트 성격",
      projectContext: "연결된 경력 구간",
      repoVerified: "GitHub 레포 검증됨",
      ribbonGenerated: "생성일",
      ribbonSource: "소스",
      ribbonTemplate: "템플릿",
      ribbonVisibility: "공개 범위",
      sections: {
        basics: "기본 정보",
        education: "학력",
        experience: "경력",
        links: "링크",
        projects: "대표 프로젝트",
        skills: "기술 스택",
        summary: "핵심 요약",
      },
    },
  },
  en: {
    actions: {
      downloadWord: "Download Word",
      downloadWordFailed: "Unable to prepare the Word file. Please try again shortly.",
      downloadWordPending: "Preparing Word...",
      repoSourceLabel: "Source",
      repoVisibilityLabel: "Repo visibility",
    },
    card: {
      activationHint:
        "The Resume template activates when a `resume` repo and root-level `resume.yaml` are available, and English can be split into `resume.en.yaml`.",
      lockedInvalid: "Schema fix needed",
      lockedMissing: "Check source access",
      ready: "Ready",
    },
    panel: {
      benefits: [
        "It captures full career history and role transitions that GitHub inference should not invent.",
        "It turns projects, experience, education, and links into a Word resume immediately.",
        "It keeps fixed sections for consistency while still allowing custom sections for talks, awards, writing, or OSS work.",
        "It keeps repo, live, and docs links close to each item so evidence travels with the resume.",
      ],
      benefitsTitle: "Why keep a resume repo",
      close: "Close",
      enabledFeatures: [
        "ATS-friendly Word (.docx) export",
        "Full coverage for experience, projects, education, skills, and custom sections",
        "Evidence rows for repo, live, and docs links",
        "Separate Korean and English manifests with `resume.yaml` and `resume.en.yaml`",
      ],
      enabledTitle: "What becomes available",
      invalidTitle: "The resume repo exists, but the schema is not ready yet.",
      invalidMessage:
        "A root-level `resume.yaml` is required. Add `resume.en.yaml` if you want a separate English version, and keep referenced Markdown files under `content/`.",
      invalidReasonLabel: "Detected issue",
      missingTitle: "No `resume` source was found within the selected access scope.",
      missingMessage:
        "Public sources work directly. For a private source, enable source access in the home page’s Resume settings and connect GitHub permissions.",
      starterTitle: "Starter structure",
      stepsTitle: "Fast activation steps",
      steps: [
        "Create a GitHub repo named `resume`.",
        "Add `resume.yaml` at the repo root.",
        "Add `resume.en.yaml` if you want a separate English resume.",
        "Move long summaries or detailed descriptions into `content/*.md` files and reference them.",
        "Return here, select Resume, and choose your sources and preview or save PDF, Word, or HTML.",
      ],
      subtitle:
        "The Resume template is not an inferred profile. It builds a resume from the `resume` repo that the user maintains directly.",
      title: "Activate the Resume template",
      toggleHint:
        "Set repository visibility on GitHub. In GitHubPrint, select source access and linked-project enrichment separately.",
      togglePrivate: "Private",
      togglePrivateHint:
        "Keep authored contact details and career history off public GitHub. When source access is allowed, that content is included in PDF, Word, and HTML.",
      togglePublic: "Public",
      togglePublicHint:
        "Easy to share as an open example and easier for others to inspect directly.",
    },
    resultState: {
      invalidTitle: "The Resume template is not ready yet.",
      invalidMessage:
        "The `resume` repo exists, but `resume.yaml`, `resume.en.yaml` when needed, or one of its Markdown references still needs to be fixed.",
      missingTitle: "No resume source was found within the selected access scope.",
      missingMessage:
        "If you already have a resume repo, you do not need to recreate it. For a private repo, allow source access below, connect GitHub permissions if needed, and load it again. If you do not have a repo, open the setup guide.",
      warningTitle: "The resume was generated with partial skips.",
      warningMessage:
        "The document stayed available, but invalid fields or broken references were omitted. Use the warnings below to clean up `resume.yaml` or `resume.en.yaml`.",
    },
    shared: {
      githubStart: "GitHub start",
      independent: "Independent project",
      current: "Current",
      private: "Private",
      public: "Public",
      present: "Present",
      whileAt: "While at",
    },
    template: {
      emptyState: "No items have been added to this section yet.",
      noSummary: "A short summary has not been added yet.",
      projectProfile: "Project profile",
      projectContext: "Linked experience context",
      repoVerified: "Verified GitHub repo",
      ribbonGenerated: "Generated",
      ribbonSource: "Source",
      ribbonTemplate: "Template",
      ribbonVisibility: "Visibility",
      sections: {
        basics: "Basics",
        education: "Education",
        experience: "Experience",
        links: "Links",
        projects: "Selected Projects",
        skills: "Technical Skills",
        summary: "Professional Summary",
      },
    },
  },
};

export function getResumeCopy(locale: Locale) {
  return resumeCopy[locale];
}
