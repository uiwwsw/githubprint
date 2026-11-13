export const documentCopy = {
  ko: {
    title: "GitHub에 남긴 것으로 쓰는 이력서",
    description:
      "공개 저장소, README, 직접 쓴 resume 저장소를 읽어 A4 문서로 정리합니다. 문서의 모든 줄은 GitHub 어디에서 왔는지 따라가 볼 수 있습니다.",
    preview: "예시 문서 보기",
    formats: "로그인하면 바로 만들 수 있습니다. PDF, Word, HTML로 저장하세요.",
    proof: {
      label: "예시 문서와 각 줄의 출처",
      sheetHead: "Profile 템플릿",
      sheetDate: "2026년 3월",
      name: "김하늘",
      role: "웹 인터페이스를 만드는 개발자",
      link: "github.com/example",
      intro:
        "Next.js와 TypeScript로 문서형 웹 도구를 만듭니다. 프로젝트마다 README와 결과물 링크를 함께 남겨 둡니다.",
      introNote: "README와 프로필 소개에서 읽은 문장",
      projectsLabel: "대표 프로젝트",
      projects: [
        ["githubprint-web", "GitHub 기록을 A4 문서로 바꾸는 웹 앱"],
        ["proto-kit", "화면 시안을 빠르게 맞춰 보는 컴포넌트 모음"],
      ],
      projectsNote: "프로필에 고정한 저장소",
      stackLabel: "사용 기술",
      stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Playwright"],
      stackNote: "두 개 이상의 저장소 파일에서 확인된 기술만",
      jobLabel: "경력",
      job: "스튜디오 예시",
      jobDate: "2024년부터",
      jobNote: "resume 저장소에 직접 쓴 내용 그대로",
    },
    stepsTitle: "만드는 순서",
    stepOne: "GitHub로 로그인",
    stepOneBody:
      "내 계정의 공개 저장소를 불러옵니다. 비공개 저장소는 직접 고른 것만 읽습니다.",
    stepTwo: "템플릿과 자료 고르기",
    stepTwoBody:
      "누구에게 보낼 문서인지에 맞춰 네 가지 템플릿 중 하나를 고릅니다.",
    stepThree: "확인하고 저장하기",
    stepThreeBody:
      "화면에서 내용을 읽어 본 뒤 PDF, Word, HTML 중 필요한 형식으로 저장합니다.",
    templates: "문서 템플릿",
    templateTitle: "읽는 사람에 따라 고르는 네 가지 문서",
    templateHint:
      "같은 GitHub 기록이라도 처음 소개할 때와 자세히 검토받을 때 필요한 구성이 다릅니다.",
    templateFor: {
      brief: "처음 연락하는 채용 담당자에게",
      profile: "프로젝트를 보고 싶어 하는 면접관에게",
      insight: "작업 방식을 함께 검토할 동료에게",
      resume: "지원서에 첨부할 정식 이력서로",
    },
    ledgerTitle: "GitHub에 보이는 것만 씁니다",
    ledgerIntro:
      "문서는 공개된 근거로만 만듭니다. 근거가 없는 평가는 문장을 그럴듯하게 만들어도 넣지 않습니다.",
    ledgerInTitle: "문서에 쓰는 자료",
    ledgerIn: [
      "프로필 정보와 공개 저장소",
      "README, 토픽, 스타, 최근 업데이트",
      "홈페이지와 배포 링크",
      "package.json 같은 저장소 루트 파일과 최근 커밋 메시지",
      "resume 저장소에 직접 쓴 경력과 연락처",
    ],
    ledgerOutTitle: "문서에 쓰지 않는 내용",
    ledgerOut: [
      "경력 연차",
      "리더십과 협업 능력에 대한 평가",
      "회사 매출이나 사업 성과",
      "다른 개발자와 비교한 순위나 점수",
    ],
    ledgerNote:
      "README가 보이지 않는다고 해서 없다고 쓰지 않고, 테스트 설정이 있다고 해서 테스트가 통과한다고 쓰지 않습니다.",
    openExample: "이 템플릿 미리보기",
    documentReady: "문서 미리보기",
    example:
      "예시 데이터로 만든 문서입니다. 실제 경력이나 개인 정보가 아닙니다.",
    back: "홈으로",
    pdf: "PDF로 저장",
    word: "Word로 저장",
    html: "HTML로 저장",
    saveShare: "저장·공유",
    saveTitle: "어떻게 전달할까요?",
    saveIntro: "현재 템플릿의 구성과 디자인을 유지해 저장하세요.",
    close: "닫기",
    pdfUse: "제출·전달",
    wordUse: "편집·협업",
    htmlUse: "브라우저로 읽기",
    pdfDescription: "페이지 구성을 유지해 지원서나 첨부 자료로 전달하세요.",
    wordDescription: "Word와 Google Docs에서 내용을 고치고 함께 다듬으세요.",
    htmlDescription:
      "현재 템플릿 그대로, 브라우저에서 열고 인쇄할 수 있습니다.",
    htmlHint:
      "글꼴·사진을 포함한 HTML 파일로 저장합니다. 인터넷 없이 열 수 있고, 모바일에 맞춰 읽기 좋게 표시됩니다. 공개 링크를 만들지는 않습니다.",
    htmlExported:
      "HTML 파일이 준비되었습니다. 내려받은 파일을 브라우저에서 열어보세요.",
    formatTitle: "필요한 형식으로 저장",
    formatSubtitle:
      "PDF와 HTML은 화면에서 본 모양 그대로, Word는 고쳐 쓸 수 있는 형태로 저장됩니다.",
    contents: "문서 목차",
    copyPublicLink: "공개 문서 링크 복사",
    copyExampleLink: "예시 링크 복사",
    linkCopied: "링크를 복사했습니다.",
    copyLinkFallback:
      "자동 복사가 지원되지 않습니다. 아래 링크를 선택해 복사하세요.",
    shareLink: "공유할 링크",
    privateShareHint:
      "내 결과 페이지는 로그인한 본인만 볼 수 있습니다. 다른 사람에게 전달하려면 문서 파일을 저장하세요.",
    exampleShareHint:
      "이 링크는 예시 문서를 엽니다. 내 문서를 만들려면 홈에서 GitHub 계정을 연결하세요.",
    publicShareHint:
      "누구나 볼 수 있는 공개 문서입니다. 링크로 바로 전달할 수 있습니다.",
    pending: "문서 준비 중…",
    pdfHint:
      "인쇄 창에서 ‘PDF로 저장’을 선택하세요. 용지 A4, 배율 100%, 머리글·바닥글 끄기를 권장합니다.",
    wordHint:
      "기본 글꼴로 저장하는 편집 가능한 .docx 파일입니다. Word와 Google Docs에서 열 수 있습니다.",
    exportHint:
      "HTML과 PDF는 같은 템플릿 스타일을 사용합니다. Word는 카드·표·서식을 편집 가능한 형태로 유지하며, 사용하는 문서 앱에 따라 줄바꿈과 페이지 수는 조금 달라질 수 있습니다.",
    exportError: "파일을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    printError:
      "인쇄 준비에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    exported: "Word 파일이 준비되었습니다.",
    exportedWithoutImage:
      "파일이 준비되었습니다. 프로필 이미지를 불러오지 못해 본문만 저장했습니다.",
    layout: "인쇄 간격",
    comfortable: "여유롭게",
    compact: "촘촘하게",
    guide: "저장 안내",
    sampleTitle: "예시 문서",
    sampleSubtitle:
      "가상의 개발자 기록으로 만든 문서입니다. 템플릿을 바꿔 보고, 실제 파일로도 저장해 보세요.",
    footer: "공개 GitHub 자료로 개발자 문서를 만듭니다.",
    showcase: "공개 이력서 사례",
    source: "소스 코드",
  },
  en: {
    title: "A resume written from what you put on GitHub",
    description:
      "GitHubPrint reads your public repositories, READMEs and your own resume repository, then lays them out as an A4 document. Every line can be traced back to where it came from on GitHub.",
    preview: "See an example document",
    formats: "Sign in to start. Save as PDF, Word or HTML.",
    proof: {
      label: "An example document and the source of each line",
      sheetHead: "Profile template",
      sheetDate: "March 2026",
      name: "Alex Morgan",
      role: "Developer building web interfaces",
      link: "github.com/example",
      intro:
        "Builds document-style web tools with Next.js and TypeScript. Each project ships with a README and a link to the result.",
      introNote: "Taken from your READMEs and profile bio",
      projectsLabel: "Selected projects",
      projects: [
        ["githubprint-web", "A web app that turns GitHub work into A4 documents"],
        ["proto-kit", "Components for checking screen drafts quickly"],
      ],
      projectsNote: "Repositories pinned to your profile",
      stackLabel: "Technologies",
      stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Playwright"],
      stackNote: "Only tools found in files across two or more repositories",
      jobLabel: "Experience",
      job: "Example Studio",
      jobDate: "Since 2024",
      jobNote: "Exactly as you wrote it in your resume repository",
    },
    stepsTitle: "How it works",
    stepOne: "Sign in with GitHub",
    stepOneBody:
      "Your public repositories are loaded. Private repositories are read only if you pick them.",
    stepTwo: "Pick a template and sources",
    stepTwoBody:
      "Choose one of four templates depending on who will read the document.",
    stepThree: "Review and save",
    stepThreeBody:
      "Read it on screen, then save it as a PDF, Word or HTML file.",
    templates: "Templates",
    templateTitle: "Four documents for four kinds of reader",
    templateHint:
      "The same GitHub history needs a different shape for a first introduction than for a detailed review.",
    templateFor: {
      brief: "For a recruiter you are contacting for the first time",
      profile: "For an interviewer who wants to see projects",
      insight: "For a peer reviewing how you work",
      resume: "As the formal resume attached to an application",
    },
    ledgerTitle: "Only what GitHub shows",
    ledgerIntro:
      "Documents are built from public evidence. A claim without evidence stays out, however good it would sound.",
    ledgerInTitle: "What goes in",
    ledgerIn: [
      "Your profile and public repositories",
      "READMEs, topics, stars and recent updates",
      "Homepage and deployment links",
      "Root files such as package.json, and recent commit messages",
      "Experience and contact details you wrote in your resume repository",
    ],
    ledgerOutTitle: "What stays out",
    ledgerOut: [
      "Years of experience",
      "Judgements about leadership or teamwork",
      "Company revenue or business results",
      "Rankings or scores against other developers",
    ],
    ledgerNote:
      "A README that wasn't found is not reported as missing, and a test setup is not reported as passing tests.",
    openExample: "Preview this template",
    documentReady: "Document preview",
    example:
      "This document uses example data, not a real person's career or personal information.",
    back: "Home",
    pdf: "Save PDF",
    word: "Save Word",
    html: "Save HTML",
    saveShare: "Save & share",
    saveTitle: "How will you share it?",
    saveIntro:
      "Save the current template’s structure and design in the format you need.",
    close: "Close",
    pdfUse: "Send & submit",
    wordUse: "Edit & collaborate",
    htmlUse: "Read in a browser",
    pdfDescription: "Keep the page layout for applications and attachments.",
    wordDescription: "Revise and collaborate in Word or Google Docs.",
    htmlDescription: "Open and print the same template in a browser.",
    htmlHint:
      "Saves an HTML file with fonts and photos included. Read it offline or on a mobile screen. This does not create a public link.",
    htmlExported:
      "Your HTML file is ready. Open the downloaded file in a browser.",
    formatTitle: "Save it the way you need it",
    formatSubtitle:
      "PDF and HTML keep the layout you see on screen. Word gives you a file you can keep editing.",
    contents: "Document contents",
    copyPublicLink: "Copy public document link",
    copyExampleLink: "Copy example link",
    linkCopied: "Link copied.",
    copyLinkFallback:
      "Automatic copying is unavailable. Select and copy the link below.",
    shareLink: "Link to share",
    privateShareHint:
      "Your results page is visible only to you when signed in. Save a document file to send it to someone else.",
    exampleShareHint:
      "This link opens an example document. Connect your GitHub account on the home page to create your own.",
    publicShareHint:
      "Anyone can read this public document. Share the link to send it directly.",
    pending: "Preparing document…",
    pdfHint:
      "Choose “Save as PDF” in the print dialog. Use A4 paper, 100% scale, and turn off browser headers and footers.",
    wordHint:
      "An editable .docx using standard fonts. Open it in Word or Google Docs.",
    exportHint:
      "HTML and PDF use the same template styles. Word preserves cards, tables, and formatting as editable content; line wrapping and page counts can vary by document app.",
    exportError: "We couldn't prepare the file. Please try again in a moment.",
    printError:
      "We couldn't prepare the print layout. Refresh the page and try again.",
    exported: "Your Word file is ready.",
    exportedWithoutImage:
      "Your file is ready. The profile image was unavailable, so the document contains text only.",
    layout: "Print spacing",
    comfortable: "Comfortable",
    compact: "Compact",
    guide: "Export guide",
    sampleTitle: "Example documents",
    sampleSubtitle:
      "Built from a fictional developer's history. Switch templates and try saving a real file.",
    footer: "Developer documents built from public GitHub work.",
    showcase: "Public resume showcase",
    source: "Source code",
  },
};
