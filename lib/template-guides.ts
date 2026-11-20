import { getDictionary } from "@/lib/i18n";
import type { Locale, TemplateId } from "@/lib/schemas";

export const TEMPLATE_IDS: TemplateId[] = [
  "brief",
  "profile",
  "insight",
  "resume",
];
export const HOME_CONTENT_UPDATED_AT = "2026-10-20";
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

function repositoryGuide(id: Exclude<TemplateId, "resume">, locale: Locale): Guide {
  const { label, shortLabel, description } = getDictionary(locale).templateMeta[id];
  if (locale === "ko") {
    return {
      title: `GitHub 저장소 목록 · ${label}`,
      description: `${description} PDF, Word, HTML로 저장할 수 있습니다.`,
      ogTitle: `GitHub 저장소 목록\n${label} 디자인`,
      intro: description,
      audience: "GitHub의 프로젝트를 골라 한 문서로 공유할 때 쓸 수 있습니다.",
      sections: [
        { title: "GitHub 프로필", body: "계정 이름과 GitHub 프로필 링크가 상단에 들어갑니다." },
        { title: shortLabel, body: description },
        { title: "저장소 정보", body: "GitHub에서 읽은 이름, 설명, 링크, 주 언어, 스타 수, 포크 수를 표시합니다." },
      ],
      preparation: "GitHub로 로그인한 뒤 저장소 목록을 고르세요. 공개 범위와 디자인을 선택하고 미리보기를 엽니다.",
    };
  }
  return {
    title: `GitHub Repository List · ${label}`,
    description: `${description} Save it as PDF, Word, or HTML.`,
    ogTitle: `GitHub repository list\n${label} design`,
    intro: description,
    audience: "Use this layout to share selected GitHub projects in a single document.",
    sections: [
      { title: "GitHub profile", body: "Your account name and a link to your GitHub profile appear at the top." },
      { title: shortLabel, body: description },
      { title: "Repository details", body: "Each repository shows its name, description, link, primary language, star count, and fork count from GitHub." },
    ],
    preparation: "Sign in with GitHub, choose Repository list, then select the visibility and design.",
  };
}

const guides: Record<Locale, Record<TemplateId, Guide>> = {
  ko: {
    brief: repositoryGuide("brief", "ko"),
    profile: repositoryGuide("profile", "ko"),
    insight: repositoryGuide("insight", "ko"),
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
    brief: repositoryGuide("brief", "en"),
    profile: repositoryGuide("profile", "en"),
    insight: repositoryGuide("insight", "en"),
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
        a: "저장소 목록이나 직접 작성한 이력서를 만들 수 있습니다. 저장소 목록에는 Brief, Profile, Insight 디자인이 있으며, 모든 문서를 PDF, Word, HTML로 저장할 수 있습니다.",
      },
      {
        q: "모든 템플릿에 resume 저장소가 필요한가요?",
        a: "이력서 전용 모드에서 resume 저장소의 resume.yaml을 사용합니다. 저장소 목록은 로그인한 뒤 바로 만들 수 있습니다.",
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
        a: "Create a repository list or format a resume you wrote. The list comes in Brief, Profile, and Insight designs. Both document types can be saved as PDF, Word, or HTML.",
      },
      {
        q: "Does every template require a resume repository?",
        a: "Resume mode uses a resume.yaml file in your resume repository. You can make a repository list as soon as you sign in.",
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
