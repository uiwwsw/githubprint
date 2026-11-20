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
      {template === "resume" ? (
        <p className="gp-mini-role">{t("웹 개발자", "Web developer")}</p>
      ) : null}
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
      {template !== "resume" ? (
        <>
          <p className="gp-mini-label">{t("저장소 목록", "Repositories")}</p>
          <div className={`gp-mini-repos gp-mini-repos-${template}`}>
            {projectA}
            {projectB}
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
