import type { Locale, TemplateId } from "@/lib/schemas";

/**
 * A miniature of each template. It uses real words at a small size and follows
 * the hierarchy and accent colour of the actual document.
 */
export function TemplatePreview({
  locale,
  template,
}: {
  locale: Locale;
  template: TemplateId;
}) {
  const ko = locale === "ko";
  const t = (k: string, e: string) => (ko ? k : e);
  const chips = (
    <div className="gp-mini-chips">
      <span>TypeScript</span>
      <span>Next.js</span>
      <span>React</span>
    </div>
  );
  const identity = (
    <>
      <p className="gp-mini-name">{t("김하늘", "Alex Morgan")}</p>
      <p className="gp-mini-role">
        {t("웹 인터페이스를 만드는 개발자", "Developer building web interfaces")}
      </p>
      <div className="gp-mini-rule" />
    </>
  );
  const projectA = (
    <div className="gp-mini-project">
      <strong>githubprint-web</strong>
      <span className="gp-mini-text">
        {t(
          "GitHub 기록을 A4 문서로 바꾸는 웹 앱",
          "Turns GitHub work into A4 documents",
        )}
      </span>
    </div>
  );
  const projectB = (
    <div className="gp-mini-project">
      <strong>proto-kit</strong>
      <span className="gp-mini-text">
        {t("화면 시안용 컴포넌트 모음", "Components for screen drafts")}
      </span>
    </div>
  );

  return (
    <div aria-hidden="true" className={`gp-mini gp-mini-${template}`}>
      {identity}
      {template === "brief" ? (
        <>
          <p className="gp-mini-text">
            {t(
              "Next.js와 TypeScript로 문서형 웹 도구를 만듭니다.",
              "Builds document-style web tools with Next.js and TypeScript.",
            )}
          </p>
          {chips}
          <p className="gp-mini-label">{t("대표 프로젝트", "Selected work")}</p>
          {projectA}
          {projectB}
        </>
      ) : template === "profile" ? (
        <>
          <p className="gp-mini-label">
            {t("대표 프로젝트", "Selected projects")}
          </p>
          <div className="gp-mini-feature">
            <strong>githubprint-web</strong>
            <p className="gp-mini-text">
              {t(
                "README, 배포 링크, 테스트 설정이 함께 있는 프로젝트",
                "Comes with a README, a live link and a test setup",
              )}
            </p>
            {chips}
          </div>
          {projectB}
        </>
      ) : template === "insight" ? (
        <>
          <p className="gp-mini-label">{t("작업 패턴", "Observed patterns")}</p>
          <p className="gp-mini-text">
            {t(
              "프로젝트마다 README와 결과물 링크를 함께 남깁니다.",
              "Leaves a README and a result link with each project.",
            )}
          </p>
          <p className="gp-mini-label">{t("근거 자료", "Evidence")}</p>
          <div className="gp-mini-grid">
            <div>
              <b>README</b>
              {t("저장소 4곳", "4 repositories")}
            </div>
            <div>
              <b>{t("테스트 설정", "Test setup")}</b>
              {t("저장소 2곳", "2 repositories")}
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="gp-mini-label">{t("경력", "Experience")}</p>
          <div className="gp-mini-job">
            {t("스튜디오 예시", "Example Studio")}
            <span>{t("2024년부터", "Since 2024")}</span>
          </div>
          <p className="gp-mini-text">
            {t(
              "문서형 웹 도구의 화면 설계와 개발",
              "Designing and building document tools",
            )}
          </p>
          <p className="gp-mini-label">{t("프로젝트", "Projects")}</p>
          {projectA}
          <p className="gp-mini-label">{t("기술", "Skills")}</p>
          {chips}
        </>
      )}
    </div>
  );
}
