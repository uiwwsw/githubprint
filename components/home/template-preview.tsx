import type { Locale, TemplateId } from "@/lib/schemas";

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
          {ko ? "프론트엔드 개발자" : "Frontend Developer"}
        </p>
        <p className="mini-contact">hello@example.com · Seoul, KR</p>
      </div>
      <div className="mini-section">
        <b>{ko ? "소개" : "ABOUT"}</b>
        <p>
          {ko
            ? "복잡한 정보를 명확한 인터페이스로.\n제품의 작은 디테일까지 고민합니다."
            : "Making complex information clear.\nThoughtful about the smallest details."}
        </p>
      </div>
      <div className="mini-section">
        <b>{ko ? "주요 경험" : "EXPERIENCE"}</b>
        <div className="mini-job">
          <strong>{ko ? "스튜디오 예시" : "Example Studio"}</strong>
          <span>2024 — NOW</span>
        </div>
        <div className="mini-lines">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="mini-section">
        <b>{ko ? "선택한 프로젝트" : "SELECTED PROJECTS"}</b>
        <strong className="mini-project">GitHubPrint</strong>
        <p>
          {ko
            ? "GitHub 기록을 전달 가능한 문서로"
            : "Your GitHub work, ready to share"}
        </p>
        <div className="mini-tags">
          <span>TypeScript</span>
          <span>Next.js</span>
          <span>React</span>
        </div>
      </div>
      <div className="mini-section">
        <b>{ko ? "기술" : "SKILLS"}</b>
        <div className="mini-lines">
          <i />
          <i />
        </div>
      </div>
      <div className="mini-footer">
        <span>{ko ? "문서 구성 예시" : "EXAMPLE DOCUMENT"}</span>
        <span>01</span>
      </div>
    </div>
  );
}
