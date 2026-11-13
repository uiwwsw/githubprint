import type { DocumentOptions } from "@/lib/document-options";
import type { ResumeDocumentData } from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

export function DataUseReceipt({
  options,
  locale,
  resume,
  privateCount = 0,
}: {
  options: DocumentOptions;
  locale: Locale;
  resume?: ResumeDocumentData;
  privateCount?: number;
}) {
  const ko = locale === "ko";
  const text =
    options.template === "resume"
      ? resume
        ? ko
          ? `원본 저장소: ${resume.source.visibility === "private" ? "비공개" : "공개"} · 비공개 연결 프로젝트 보강: ${resume.source.linkedPrivateRepoCount ?? 0}개. 직접 작성한 연락처·경력·링크도 파일에 포함됩니다.`
          : `Source repository: ${resume.source.visibility}. Private linked projects enriched: ${resume.source.linkedPrivateRepoCount ?? 0}. Authored contact details, career history, and links are included in files.`
        : ko
          ? "선택한 접근 범위에서 이력서 원본을 읽지 못했습니다. 비공개 원본이라면 홈에서 원본 접근을 허용해 주세요."
          : "The resume source could not be read within the selected scope. For a private source, enable source access on the home page."
      : options.analysisScope === "public"
        ? ko
          ? "공개 프로필과 공개 저장소만 사용했습니다. 비공개 저장소는 읽지 않았습니다."
          : "Used only your public profile and public repositories. Private repositories were not read."
        : ko
          ? `선택한 비공개 저장소 ${privateCount}개 · ${options.analysisScope === "private-details" ? "이름·설명·링크 포함" : "익명 집계만 포함"}. 프로젝트 자료 목록은 공개 자료 기준이며, 비공개 데이터는 외부 AI와 학습 기록에 전달하지 않았습니다.`
          : `${privateCount} selected private repositories · ${options.analysisScope === "private-details" ? "names, descriptions, and links included" : "anonymous aggregates only"}. The project evidence review uses public evidence. Private data was not sent to external AI or learning records.`;
  return (
    <section
      className="gp-notice screen-only mx-auto max-w-[210mm]"
      aria-label={ko ? "사용한 자료" : "Sources used"}
    >
      <h2 className="text-sm font-bold">
        {ko
          ? "이 문서에 사용한 자료"
          : "Sources used in this document"}
      </h2>
      <p className="mt-1 text-[13px] leading-6 text-ink-soft">
        {text}{" "}
        {ko
          ? "PDF, Word, HTML 모두 같은 자료로 저장됩니다."
          : "PDF, Word and HTML files use the same sources."}
      </p>
      <a
        href={locale === "ko" ? "/#generator" : "/en#generator"}
        className="gp-text-link mt-2 inline-block text-[13px]"
      >
        {ko ? "자료 범위 다시 선택" : "Choose sources again"}
      </a>
    </section>
  );
}
