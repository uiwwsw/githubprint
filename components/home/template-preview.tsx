import type { Locale, TemplateId } from "@/lib/schemas";

/** Small illustrations mirror the hierarchy of each actual document template. */
export function TemplatePreview({
  locale,
  template,
  hero = false,
}: {
  locale: Locale;
  template: TemplateId;
  hero?: boolean;
}) {
  const ko = locale === "ko";
  const tags = (
    <div className="mini-tags">
      <span>TypeScript</span>
      <span>Next.js</span>
      <span>React</span>
    </div>
  );
  const lines = (
    <div className="mini-lines">
      <i />
      <i />
      <i />
    </div>
  );
  const projects = (
    <>
      <div className="mini-project-row">
        <span>01</span>
        <strong>GitHubPrint</strong>
        <p>
          {ko
            ? "GitHub 기록을 전달 가능한 문서로"
            : "GitHub work, ready to share"}
        </p>
        {tags}
      </div>
      <div className="mini-project-row">
        <span>02</span>
        <strong>Component Notes</strong>
        <p>
          {ko
            ? "일관된 화면을 위한 컴포넌트 모음"
            : "Components for consistent interfaces"}
        </p>
        {lines}
      </div>
    </>
  );
  return (
    <div
      aria-hidden="true"
      className={`mini-document mini-document-${template} ${hero ? "mini-document-hero" : ""}`}
    >
      <div className="mini-masthead">
        <span>GITHUBPRINT</span>
        <span>{template.toUpperCase()}</span>
      </div>
      <div className="mini-identity">
        <p className="mini-name">{ko ? "김하늘" : "Alex Morgan"}</p>
        <p className="mini-role">
          {ko ? "인터페이스와 웹 제품" : "Interfaces and web products"}
        </p>
        <p className="mini-contact">
          {template === "resume"
            ? "hello@example.com · Seoul, KR"
            : "github.com/example"}
        </p>
      </div>
      {template === "brief" ? (
        <>
          <p className="mini-intro">
            {ko
              ? "만든 프로젝트와 사용 기술을 간결하게 소개합니다."
              : "Selected projects and the technologies behind them."}
          </p>
          {tags}
          <div className="mini-section">
            <b>{ko ? "대표 프로젝트" : "SELECTED WORK"}</b>
            {projects}
          </div>
          <div className="mini-section mini-columns">
            <div>
              <b>{ko ? "핵심 특징" : "HIGHLIGHTS"}</b>
              {lines}
            </div>
            <div>
              <b>{ko ? "최근 활동" : "ACTIVITY"}</b>
              {lines}
            </div>
          </div>
        </>
      ) : template === "profile" ? (
        <>
          <p className="mini-intro">
            {ko
              ? "무엇을 만들었는지, 프로젝트로 보여줍니다."
              : "A closer look at the work behind the profile."}
          </p>
          <div className="mini-section">
            <b>{ko ? "대표 프로젝트" : "SELECTED PROJECTS"}</b>
            {projects}
          </div>
          <div className="mini-section">
            <b>{ko ? "사용 기술" : "TECHNOLOGIES"}</b>
            {tags}
          </div>
        </>
      ) : template === "insight" ? (
        <>
          <div className="mini-section">
            <b>{ko ? "01 / 작업 패턴" : "01 / OBSERVATIONS"}</b>
            {lines}
          </div>
          <div className="mini-section">
            <b>{ko ? "02 / 비교 지표" : "02 / CONTEXT"}</b>
            <div className="mini-metrics">
              {["ACTIVITY", "DOCS", "TESTS", "STRUCTURE"].map((label) => (
                <div key={label}>
                  <span>{label}</span>
                  <i />
                  <i />
                </div>
              ))}
            </div>
          </div>
          <div className="mini-section">
            <b>{ko ? "03 / 프로젝트" : "03 / PROJECTS"}</b>
            {lines}
          </div>
        </>
      ) : (
        <>
          <div className="mini-section">
            <b>{ko ? "소개" : "ABOUT"}</b>
            <p>
              {ko
                ? "복잡한 정보를 명확한 인터페이스로.\n작은 디테일까지 고민합니다."
                : "Making complex information clear.\nThoughtful about the smallest details."}
            </p>
          </div>
          <div className="mini-section">
            <b>{ko ? "경력" : "EXPERIENCE"}</b>
            <div className="mini-job">
              <strong>{ko ? "스튜디오 예시" : "Example Studio"}</strong>
              <span>2024 — NOW</span>
            </div>
            {lines}
          </div>
          <div className="mini-section">
            <b>{ko ? "프로젝트" : "PROJECTS"}</b>
            <strong className="mini-project">GitHubPrint</strong>
            {lines}
            {tags}
          </div>
          <div className="mini-section">
            <b>{ko ? "기술" : "SKILLS"}</b>
            {lines}
          </div>
        </>
      )}
      <div className="mini-footer">
        <span>{ko ? "문서 구성 예시" : "EXAMPLE DOCUMENT"}</span>
        <span>01</span>
      </div>
    </div>
  );
}
