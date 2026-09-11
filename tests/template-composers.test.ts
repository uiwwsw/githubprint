import assert from "node:assert/strict";
import test from "node:test";
import {
  composeBriefTemplateView,
  composeInsightTemplateView,
  composeProfileTemplateView,
} from "../lib/template-composers";
import type { GitHubPrintAnalysis, BenchmarkSnapshot } from "../lib/schemas";
const analysis = {
  profile: {
    summary:
      "Next.js와 Python 3.12로 구현했습니다. example.dev에서 확인할 수 있습니다. 추가 설명입니다.",
  },
  inferred: {
    strengths: ["실행 가능한 데모", "검증 도구"],
    developerType: "웹 인터페이스 구현",
    workingStyle: "테스트와 문서화",
  },
  facts: { activityNote: "최근 업데이트" },
} as GitHubPrintAnalysis;
const benchmark = {} as BenchmarkSnapshot;

test("Brief keeps dotted technologies, versions, and domains intact when shortening a summary", () => {
  assert.equal(
    composeBriefTemplateView(analysis, benchmark, "ko").summary,
    "Next.js와 Python 3.12로 구현했습니다. example.dev에서 확인할 수 있습니다.",
  );
  assert.equal(
    composeProfileTemplateView(analysis, benchmark, "ko").summary,
    analysis.profile.summary,
  );
});
test("Brief uses readable highlights without concatenating raw API evidence", () => {
  assert.deepEqual(
    composeBriefTemplateView(analysis, benchmark, "ko").highlights,
    analysis.inferred.strengths,
  );
});
test("Insight identifies exploratory areas without implying verified job fit", () => {
  for (const locale of ["ko", "en"] as const) {
    const result = composeInsightTemplateView(analysis, benchmark, locale);
    assert.match(
      result.fitNarrative,
      locale === "ko"
        ? /실제 담당 업무를 뜻하지는/
        : /not assessments of hiring fit/,
    );
  }
});
