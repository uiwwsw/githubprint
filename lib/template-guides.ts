import type { Locale, TemplateId } from "@/lib/schemas";

export const TEMPLATE_IDS: TemplateId[] = [
  "brief",
  "profile",
  "insight",
  "resume",
];
export const PUBLIC_CONTENT_UPDATED_AT = "2026-09-11";
export const getTemplateGuidePath = (id: TemplateId, locale: Locale) =>
  `${locale === "en" ? "/en" : ""}/templates/${id}`;

type Guide = {
  title: string;
  description: string;
  ogTitle: string;
  intro: string;
  audience: string;
  sections: { title: string; body: string }[];
  preparation: string;
};

const guides: Record<Locale, Record<TemplateId, Guide>> = {
  ko: {
    brief: {
      title: "GitHub 개발자 소개서 PDF·Word 템플릿 — Brief",
      description:
        "GitHub 프로젝트와 기술 스택을 짧은 개발자 소개서로 정리하세요. Brief의 구성과 활용법을 확인하고 한국어·영어 PDF 및 Word 예시를 내려받을 수 있습니다.",
      ogTitle: "핵심만 담은\nGitHub 개발자 소개서",
      intro:
        "처음 만나는 동료에게 GitHub 링크만 전달하면 무엇부터 봐야 할지 알기 어렵습니다. Brief는 계정의 핵심 기술, 확인 가능한 활동, 대표 프로젝트를 먼저 읽을 수 있도록 정리하는 개발자 소개서입니다.",
      audience:
        "네트워킹, 협업 제안, 첫 미팅 전에 작업의 개요를 빠르게 공유할 때 적합합니다. 자세한 경력 이력보다 현재 공개된 작업의 방향을 소개하는 데 초점을 둡니다.",
      sections: [
        {
          title: "프로필과 핵심 기술",
          body: "GitHub 프로필과 대표 저장소에서 확인한 기술을 문서 앞부분에 배치합니다. 짧은 요약으로 전체 방향을 소개하고, 뒤에 나오는 프로젝트를 읽을 수 있는 맥락을 제공합니다.",
        },
        {
          title: "대표 프로젝트와 확인된 특징",
          body: "저장소 설명, README, 기술 구성과 링크를 모아 작업을 살펴볼 출발점을 만듭니다. 결과물의 근거를 직접 확인할 수 있도록 저장소와 서비스 링크를 함께 전달합니다.",
        },
        {
          title: "활동과 비교 지표의 해석",
          body: "공개 활동과 비교 지표를 참고 정보로 제공합니다. 데이터가 적거나 해석의 신뢰도가 낮으면 보수적으로 표시하며, 숫자만으로 개발 역량이나 협업 능력을 단정하지 않습니다.",
        },
      ],
      preparation:
        "GitHub 계정으로 로그인한 뒤 Brief를 선택하세요. 별도의 resume 저장소는 필요하지 않습니다. 짧은 소개를 위한 구성이지만 데이터 분량에 따라 여러 페이지가 될 수 있으므로 저장 전 미리보기를 확인하세요.",
    },
    profile: {
      title: "GitHub 개발자 포트폴리오 PDF·Word 템플릿 — Profile",
      description:
        "대표 프로젝트, 기술 스택, 작업 특징을 담은 GitHub 포트폴리오를 만드세요. Profile 템플릿을 미리 보고 A4 PDF와 편집 가능한 Word 문서로 저장할 수 있습니다.",
      ogTitle: "프로젝트로 설명하는\n개발자 포트폴리오",
      intro:
        "Profile은 여러 저장소에 흩어진 프로젝트와 기술을 하나의 개발자 포트폴리오로 연결합니다. 짧은 소개보다 넓은 범위의 작업을 보여주고 싶을 때 사용할 수 있는 기본 문서 형식입니다.",
      audience:
        "포트폴리오 첨부 자료, 협업 검토 자료, 개발자로서의 작업 방향을 정리하는 문서에 적합합니다. 직접 작성한 경력을 중심으로 보여주고 싶다면 Resume 템플릿을 함께 살펴보세요.",
      sections: [
        {
          title: "작업 방향을 설명하는 프로필",
          body: "소개, 핵심 기술과 작업 특징을 함께 읽을 수 있게 구성합니다. 공개된 저장소에서 어떤 개발 활동이 반복되는지 살피되, 관찰 가능한 사실과 해석을 구분합니다.",
        },
        {
          title: "대표 프로젝트를 읽는 근거",
          body: "프로젝트 설명과 기술 구성, README나 서비스 링크 등 확인 가능한 자료를 함께 제공합니다. 문서의 설명을 읽은 사람이 실제 코드와 결과물로 이동할 수 있습니다.",
        },
        {
          title: "강점, 역할 적합성, 해석의 한계",
          body: "프로젝트에서 드러난 기술적 특징을 바탕으로 강점과 어울리는 역할을 정리합니다. 공개 GitHub 정보만으로 재직 기간, 팀 리더십, 협업 성과를 증명할 수는 없다는 점을 함께 안내합니다.",
        },
      ],
      preparation:
        "GitHub 로그인 후 Profile을 선택합니다. 최신 README와 정확한 저장소 설명, 접근 가능한 프로젝트 링크가 있으면 작업을 이해할 근거가 더 분명해집니다. 생성 후 설명과 원본 링크가 의도에 맞는지 확인하세요.",
    },
    insight: {
      title: "GitHub 개발 활동 분석 리포트 PDF·Word — Insight",
      description:
        "GitHub 프로젝트의 반복 패턴과 기술 방향을 근거와 함께 읽어보세요. Insight 개발 활동 리포트의 구성, 해석 범위, PDF·Word 예시를 확인할 수 있습니다.",
      ogTitle: "근거와 함께 읽는\nGitHub 활동 리포트",
      intro:
        "Insight는 프로젝트를 나열하는 데서 한 걸음 더 나아가, 공개 기록에서 반복되는 개발 방향과 작업 패턴을 설명하는 리포트입니다. 관찰된 사실과 해석의 근거를 함께 읽을 수 있도록 구성합니다.",
      audience:
        "내 GitHub가 어떤 개발자로 읽히는지 점검하거나 프로젝트 기록을 정리할 때 유용합니다. 기술 방향에 대한 참고 자료이며, 채용 평가 점수나 업무 성과를 증명하는 자료는 아닙니다.",
      sections: [
        {
          title: "핵심 해석과 반복되는 패턴",
          body: "대표 프로젝트에서 반복되는 기술과 구현 영역을 연결합니다. 프로젝트의 설명, README, 기술 구성에 나타난 신호를 바탕으로 문서의 해석이 어디에서 나왔는지 보여줍니다.",
        },
        {
          title: "프로젝트별 읽기",
          body: "각 프로젝트가 전체 활동에서 어떤 특징을 보여주는지 설명합니다. 단순히 사용하는 언어를 세는 대신, 확인 가능한 결과물과 문서화 흔적을 함께 살펴볼 수 있습니다.",
        },
        {
          title: "비교 지표와 데이터 범위",
          body: "유사한 공개 GitHub 기록과 비교한 지표를 해석의 보조 자료로 제공합니다. 표본과 신뢰도에 따라 보수적인 표현을 사용하며, 데이터에 없는 경력이나 비즈니스 성과를 만들어 내지 않습니다.",
        },
      ],
      preparation:
        "GitHub 로그인 후 Insight를 선택하세요. 결과를 읽을 때는 근거 링크를 함께 확인하고, 공개하지 않은 작업이 리포트에 반영되지 않을 수 있다는 점을 고려하세요. 저장할 파일에도 해석의 한계가 함께 담깁니다.",
    },
    resume: {
      title: "GitHub 이력서 PDF·Word 템플릿 — Resume",
      description:
        "GitHub resume 저장소의 경력, 프로젝트, 학력, 기술을 이력서로 구성하세요. Resume 템플릿으로 A4 PDF와 편집 가능한 Word 문서를 만들고 Google Docs에서 열 수 있습니다.",
      ogTitle: "직접 쓴 경험을\nPDF·Word 이력서로",
      intro:
        "Resume은 GitHub 활동에서 경력을 추정하는 대신, resume 저장소에 직접 작성한 경험과 프로젝트를 이력서로 만듭니다. 구조화된 정보와 Markdown 본문을 읽기 좋은 문서로 연결합니다.",
      audience:
        "직접 작성한 경력, 학력, 프로젝트 설명을 바탕으로 지원용 이력서를 관리할 때 적합합니다. Git으로 내용을 관리하면서 PDF를 전달하거나 Word에서 문구를 다듬을 수 있습니다.",
      sections: [
        {
          title: "소개, 경력과 대표 프로젝트",
          body: "프로필과 핵심 요약 다음에 작성한 경력과 프로젝트를 배치합니다. 프로젝트의 기간, 기술, 설명과 링크를 보존하고, 빈 항목은 문서를 불필요하게 늘리지 않도록 처리합니다.",
        },
        {
          title: "학력, 기술과 추가 섹션",
          body: "resume 데이터에 작성한 학력과 기술 그룹, 추가 항목을 함께 구성합니다. 긴 프로젝트 설명은 내용이 누락되지 않게 다음 페이지로 이어지고, 짧은 항목은 가능한 한 같은 페이지에 묶입니다.",
        },
        {
          title: "편집 가능한 Word와 공유용 PDF",
          body: "Word에는 제목, 문단, 목록과 링크가 편집 가능한 요소로 들어갑니다. 한글 글꼴도 포함합니다. PDF는 미리보기의 시각적 구성을 바탕으로 A4 인쇄 레이아웃을 사용합니다.",
        },
      ],
      preparation:
        "계정의 resume 저장소에 루트 resume.yaml과 참조하는 Markdown 파일을 준비하세요. 영어 문서를 따로 관리하면 resume.en.yaml을 사용할 수 있습니다. GitHub로 로그인한 후 Resume를 선택하고, 실제 경력과 연락처가 정확한지 확인한 뒤 저장하세요.",
    },
  },
  en: {
    brief: {
      title: "GitHub Developer Brief Template for PDF & Word",
      description:
        "Turn GitHub projects and technical skills into a concise developer introduction. Explore the Brief template and download editable Word and A4 PDF examples.",
      ogTitle: "A concise introduction\nto your GitHub work",
      intro:
        "A GitHub profile link does not always tell a new collaborator where to start. Brief organizes your core technologies, observable activity, and selected projects into a developer introduction that is easy to scan.",
      audience:
        "Use it before a first meeting, in a collaboration proposal, or as supporting material when networking. It introduces the direction of your visible work rather than providing a complete employment history.",
      sections: [
        {
          title: "Profile and core technologies",
          body: "The opening combines a short summary with technologies found in the account and selected repositories. This gives the reader context before they move into individual projects.",
        },
        {
          title: "Selected projects with evidence",
          body: "Repository descriptions, README information, technical details, and product links provide starting points for exploring the work. Readers can follow the original sources rather than relying only on the generated description.",
        },
        {
          title: "Activity and comparative context",
          body: "Public activity and peer comparisons are supporting information. Small samples or lower confidence produce more conservative labels. A repository metric does not establish collaboration skills or overall engineering ability.",
        },
      ],
      preparation:
        "Sign in with GitHub and choose Brief; a separate resume repository is not required. Although the structure is concise, the number of pages depends on the amount of content. Review the document and its source links before exporting.",
    },
    profile: {
      title: "GitHub Developer Portfolio Template for PDF & Word",
      description:
        "Build a developer portfolio from GitHub projects, technical skills, and working patterns. Preview the Profile template and export it as an A4 PDF or editable Word document.",
      ogTitle: "A developer portfolio\nbuilt around your projects",
      intro:
        "Profile brings projects and technologies spread across repositories into one developer portfolio. It is the general-purpose format for showing a broader body of work than a short introduction can cover.",
      audience:
        "Use it as a portfolio attachment, a collaboration reference, or a way to review the direction of your technical work. Choose Resume instead when you need to present an employment history that you have written yourself.",
      sections: [
        {
          title: "A profile with technical context",
          body: "The introduction connects core technologies with observable working patterns. It explains what recurs across public repositories while keeping evidence distinct from interpretation.",
        },
        {
          title: "Projects readers can explore",
          body: "Selected projects include descriptions, technologies, and available repository or product links. The document gives readers a route from a high-level overview to the actual code and output.",
        },
        {
          title: "Strengths, role fit, and limitations",
          body: "Technical patterns help describe potential strengths and suitable areas of work. Public GitHub records alone cannot prove employment duration, team leadership, collaboration quality, or business impact; the document explains those limits.",
        },
      ],
      preparation:
        "Sign in with GitHub and select Profile. Clear repository descriptions, current READMEs, and accessible project links make the available evidence easier to interpret. Review the generated wording and original sources before sharing.",
    },
    insight: {
      title: "GitHub Activity Analysis Report for PDF & Word",
      description:
        "Explore recurring technologies and project patterns with the Insight GitHub report. Review the evidence, interpretation limits, and downloadable PDF and Word examples.",
      ogTitle: "Understand the patterns\nin your GitHub work",
      intro:
        "Insight goes beyond listing repositories to explain recurring development patterns in public GitHub records. It presents the interpretation alongside the evidence used to form it, so you can understand how the account is being read.",
      audience:
        "Use the report to reflect on your technical direction or improve the way you document projects. It is supporting context, not a hiring score or proof of performance in a workplace.",
      sections: [
        {
          title: "Core interpretation and recurring patterns",
          body: "The report connects technologies and implementation areas that recur across selected projects. Repository descriptions, READMEs, and technical signals explain where each interpretation comes from.",
        },
        {
          title: "A reading of individual projects",
          body: "Each project is considered in the context of the wider body of work. Available output and documentation provide more context than a simple count of programming languages.",
        },
        {
          title: "Benchmarks and data boundaries",
          body: "Comparisons with similar public GitHub records serve as interpretive aids. Labels take sample size and confidence into account. The report does not invent employment experience or commercial outcomes that are absent from the evidence.",
        },
      ],
      preparation:
        "Sign in with GitHub and choose Insight. Read the linked evidence with the narrative, and remember that work you have not made available may be missing from the picture. Interpretation limits remain part of the exported document.",
    },
    resume: {
      title: "GitHub Resume Template for PDF & Editable Word",
      description:
        "Turn your GitHub resume repository into an A4 PDF or editable Word resume. Preserve experience, projects, education, and skills, with DOCX import into Google Docs.",
      ogTitle: "Your experience,\nready for PDF and Word",
      intro:
        "Resume turns experience and projects that you write in a GitHub resume repository into a structured document. It uses your authored information and Markdown content instead of inferring employment history from repository activity.",
      audience:
        "Use it to maintain an application resume in Git, share a PDF, or refine wording in Word. You stay responsible for the accuracy of your career history, dates, project descriptions, and contact details.",
      sections: [
        {
          title: "Summary, experience, and projects",
          body: "Your introduction is followed by authored experience and project entries. Dates, technologies, descriptions, and links are preserved. Empty sections are omitted instead of adding unnecessary space.",
        },
        {
          title: "Education, skills, and additional sections",
          body: "The document includes the education, skill groups, and custom content defined in your resume data. Long descriptions can continue across pages without being truncated, while short entries are kept together where possible.",
        },
        {
          title: "Editable Word and shareable PDF",
          body: "The Word file contains editable headings, paragraphs, lists, and links, with Korean fonts embedded. PDF uses the visual preview and an A4 print layout. Their page counts may differ because the formats handle text flow differently.",
        },
      ],
      preparation:
        "Create a resume repository with a root resume.yaml and its referenced Markdown files. Use resume.en.yaml when you maintain a separate English version. Sign in with GitHub, choose Resume, review your information, and then export.",
    },
  },
};

export const getTemplateGuide = (id: TemplateId, locale: Locale) =>
  guides[locale][id];

export const guideCopy = {
  ko: {
    home: "홈",
    overview: "템플릿 안내",
    preview: "예시 문서와 다운로드",
    start: "내 문서 만들기",
    audience: "이런 상황에 적합합니다",
    structure: "문서에 담기는 내용",
    preparation: "준비와 사용 방법",
    exports: "PDF·Word·HTML로 활용하기",
    related: "다른 문서 형식 살펴보기",
    exportBody:
      "PDF로 저장을 누른 뒤 인쇄 창에서 PDF 저장을 선택하세요. A4, 배율 100%, 브라우저 머리글·바닥글 끄기를 권장합니다. Word는 현재 미리보기 내용으로 .docx 파일을 만듭니다. Google Docs에서는 이 파일을 업로드해 편집할 수 있으며, 가져올 때 글꼴이나 페이지 나눔이 달라질 수 있습니다. 저장·공유 메뉴에서 HTML을 고르면 글꼴과 사진을 포함한 파일을 내려받습니다. 목차와 모바일 레이아웃을 갖춘 문서로, 브라우저에서 인터넷 없이 읽을 수 있습니다. HTML 저장만으로 공개 링크가 만들어지지는 않습니다.",
    faqTitle: "GitHub 문서 만들기, 자주 묻는 질문",
    faq: [
      {
        q: "GitHubPrint로 어떤 문서를 만들 수 있나요?",
        a: "개발자 소개서 Brief, 포트폴리오 Profile, 개발 활동 리포트 Insight, 직접 작성한 이력서 Resume를 만들 수 있습니다. 네 가지 템플릿 모두 한국어·영어와 PDF·Word·HTML 내보내기를 지원합니다.",
      },
      {
        q: "모든 템플릿에 resume 저장소가 필요한가요?",
        a: "Resume 템플릿에만 resume 저장소와 resume.yaml이 필요합니다. Brief, Profile, Insight는 GitHub 프로필과 프로젝트 정보를 바탕으로 문서를 구성합니다.",
      },
      {
        q: "로그인 없이 예시 파일을 받아볼 수 있나요?",
        a: "예시 문서 미리보기에서 로그인 없이 PDF, Word, HTML 저장을 시험할 수 있습니다. 예시는 가상의 데이터이며, 내 계정의 문서를 만들 때는 GitHub 로그인이 필요합니다.",
      },
      {
        q: "Google Docs에서도 편집할 수 있나요?",
        a: "내려받은 .docx 파일을 Google Docs에 업로드해 열 수 있습니다. 글꼴과 페이지 나눔은 사용하는 편집기에 따라 달라질 수 있습니다.",
      },
      {
        q: "내 결과 문서가 검색엔진에 공개되나요?",
        a: "로그인한 사용자의 결과 페이지는 검색 색인에서 제외되도록 설정되어 있습니다. 공개 이력서 showcase는 별도로 공개된 콘텐츠이며, 일반 결과 페이지와 구분됩니다.",
      },
    ],
  },
  en: {
    home: "Home",
    overview: "Template guide",
    preview: "Preview and download an example",
    start: "Create your document",
    audience: "When to use this format",
    structure: "What the document includes",
    preparation: "Preparation and workflow",
    exports: "Working with PDF, Word, and HTML",
    related: "Explore other document formats",
    exportBody:
      "Choose Save PDF, then save as PDF in the browser print dialog. Use A4 paper, 100% scale, and turn off browser headers and footers. Word exports use the current preview to create an editable .docx file. Upload that file to Google Docs to edit it there; fonts and page breaks can change during import. Choose HTML from Save & share for a file with fonts and photos included, a table of contents, and a mobile layout. It opens offline in a browser. Saving HTML does not publish a link.",
    faqTitle: "Questions about creating GitHub documents",
    faq: [
      {
        q: "What can I create with GitHubPrint?",
        a: "Create a Brief introduction, a Profile portfolio, an Insight activity report, or an authored Resume. All four formats support Korean and English, with PDF, editable Word, and portable HTML exports.",
      },
      {
        q: "Does every template require a resume repository?",
        a: "Only Resume requires a resume repository and resume.yaml. Brief, Profile, and Insight use your GitHub profile and project information to compose the document.",
      },
      {
        q: "Can I download examples without signing in?",
        a: "The example preview lets you try PDF, Word, and HTML downloads without signing in. Examples use fictional data. Creating a document from your own account requires GitHub sign-in.",
      },
      {
        q: "Can I edit the file in Google Docs?",
        a: "Upload the downloaded .docx file to Google Docs and open it there. Font choices and pagination can vary between editors.",
      },
      {
        q: "Will my result appear in search engines?",
        a: "Signed-in result pages are configured to be excluded from search indexing. The public resume showcase contains separately published content and is distinct from personal result pages.",
      },
    ],
  },
};
