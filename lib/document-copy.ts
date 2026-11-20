export const documentCopy = {
  ko: {
    title: "GitHub 저장소 목록과 이력서",
    description:
      "GitHub 저장소를 목록으로 정리하거나 직접 작성한 이력서를 문서로 만드세요.",
    preview: "예시 문서 보기",
    formats: "로그인하면 바로 만들 수 있습니다. PDF, Word, HTML로 저장하세요.",
    proof: {
      label: "예시 문서와 각 줄의 출처",
      sheetHead: "Resume",
      sheetDate: "2026년 3월",
      name: "김하늘",
      role: "웹 인터페이스를 만드는 개발자",
      link: "github.com/example",
      intro:
        "Next.js와 TypeScript로 문서형 웹 도구를 만듭니다. 프로젝트마다 README와 결과물 링크를 함께 남겨 둡니다.",
      introNote: "이력서에 직접 작성한 소개",
      projectsLabel: "대표 프로젝트",
      projects: [
        ["githubprint-web", "GitHub 기록을 A4 문서로 바꾸는 웹 앱"],
        ["proto-kit", "화면 시안을 빠르게 맞춰 보는 컴포넌트 모음"],
      ],
      projectsNote: "이력서에 추가한 프로젝트",
      stackLabel: "사용 기술",
      stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Playwright"],
      stackNote: "이력서에 적은 기술",
      jobLabel: "경력",
      job: "스튜디오 예시",
      jobDate: "2024년부터",
      jobNote: "resume 저장소에 직접 쓴 내용 그대로",
    },
    stepsTitle: "만드는 순서",
    stepOne: "GitHub로 로그인",
    stepOneBody:
      "내 GitHub 계정을 연결합니다.",
    stepTwo: "문서 종류 고르기",
    stepTwoBody:
      "저장소 목록은 공개 범위와 디자인을 고릅니다. 이력서는 직접 작성한 resume.yaml을 사용합니다.",
    stepThree: "확인하고 저장하기",
    stepThreeBody:
      "화면에서 내용을 읽어 본 뒤 PDF, Word, HTML 중 필요한 형식으로 저장합니다.",
    templates: "문서 템플릿",
    templateTitle: "저장소 목록 디자인과 이력서 예시",
    templateHint:
      "Brief, Profile, Insight는 같은 저장소 목록을 다른 디자인으로 보여줍니다.",
    ledgerTitle: "문서에 들어가는 내용",
    ledgerIntro: "공개 저장소는 최대 5개를 담습니다. 비공개 저장소는 최대 3개까지 직접 고를 수 있습니다.",
    ledgerInTitle: "저장소 목록",
    ledgerIn: ["GitHub 프로필 링크", "저장소 이름, 설명, 링크"],
    ledgerOutTitle: "이력서",
    ledgerOut: ["resume.yaml에 적은 소개, 경력, 프로젝트", "직접 작성한 학력, 기술, 연락처"],
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
    footer: "GitHub로 저장소 목록과 이력서를 만듭니다.",
    showcase: "공개 이력서 사례",
    source: "소스 코드",
  },
  en: {
    title: "Repository lists and resumes from GitHub",
    description:
      "Turn your GitHub repositories or a resume you wrote into a document you can share.",
    preview: "See an example document",
    formats: "Sign in to start. Save as PDF, Word or HTML.",
    proof: {
      label: "An example document and the source of each line",
      sheetHead: "Resume",
      sheetDate: "March 2026",
      name: "Alex Morgan",
      role: "Developer building web interfaces",
      link: "github.com/example",
      intro:
        "Builds document-style web tools with Next.js and TypeScript. Each project ships with a README and a link to the result.",
      introNote: "Introduction from your resume",
      projectsLabel: "Selected projects",
      projects: [
        ["githubprint-web", "A web app that turns GitHub work into A4 documents"],
        ["proto-kit", "Components for checking screen drafts quickly"],
      ],
      projectsNote: "Projects added to your resume",
      stackLabel: "Technologies",
      stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Playwright"],
      stackNote: "Technologies listed in your resume",
      jobLabel: "Experience",
      job: "Example Studio",
      jobDate: "Since 2024",
      jobNote: "Exactly as you wrote it in your resume repository",
    },
    stepsTitle: "How it works",
    stepOne: "Sign in with GitHub",
    stepOneBody:
      "Connect your GitHub account.",
    stepTwo: "Choose a document type",
    stepTwoBody:
      "For a repository list, choose the visibility and design. For a resume, use your own resume.yaml.",
    stepThree: "Review and save",
    stepThreeBody:
      "Read it on screen, then save it as a PDF, Word or HTML file.",
    templates: "Templates",
    templateTitle: "Repository designs and a resume example",
    templateHint:
      "Brief, Profile, and Insight show the same repositories in different layouts.",
    ledgerTitle: "What goes in your document",
    ledgerIntro: "Include up to five public repositories. You can also select up to three private repositories.",
    ledgerInTitle: "Repository list",
    ledgerIn: ["GitHub profile link", "Repository names, descriptions, and links"],
    ledgerOutTitle: "Resume",
    ledgerOut: ["Introduction, experience, and projects from resume.yaml", "Your education, skills, and contact details"],
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
    footer: "Repository lists and resumes from GitHub.",
    showcase: "Public resume showcase",
    source: "Source code",
  },
};
