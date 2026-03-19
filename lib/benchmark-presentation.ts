import type { Locale } from "@/lib/schemas";

const SMALL_SAMPLE_THRESHOLD = 120;
const LOW_CONFIDENCE_THRESHOLD = 45;

export function percentileToTopPercent(percentile: number) {
  return Math.max(1, 100 - percentile);
}

export function shouldUseBandPresentation(
  confidenceScore: number,
  sampleSize: number,
) {
  return (
    confidenceScore < LOW_CONFIDENCE_THRESHOLD ||
    sampleSize < SMALL_SAMPLE_THRESHOLD
  );
}

function getBandLabel(percentile: number, locale: Locale) {
  if (percentile >= 75) {
    return locale === "ko" ? "상위권" : "Stronger band";
  }
  if (percentile >= 45) {
    return locale === "ko" ? "중간 이상" : "Above the middle";
  }

  return locale === "ko" ? "초기 신호" : "Early signal";
}

export function formatBenchmarkRankLabel({
  percentile,
  confidenceScore,
  sampleSize,
  locale,
}: {
  percentile: number;
  confidenceScore: number;
  sampleSize: number;
  locale: Locale;
}) {
  if (shouldUseBandPresentation(confidenceScore, sampleSize)) {
    return getBandLabel(percentile, locale);
  }

  const topPercent = percentileToTopPercent(percentile);
  return locale === "ko" ? `상위 ${topPercent}%` : `Top ${topPercent}%`;
}

export function getBenchmarkInterpretationNote({
  confidenceScore,
  sampleSize,
  locale,
}: {
  confidenceScore: number;
  sampleSize: number;
  locale: Locale;
}) {
  const lowConfidence = confidenceScore < LOW_CONFIDENCE_THRESHOLD;
  const smallSample = sampleSize < SMALL_SAMPLE_THRESHOLD;

  if (lowConfidence && smallSample) {
    return locale === "ko"
      ? "공개 근거와 비교 표본이 모두 제한적이라 exact 퍼센트보다 대략적인 구간으로 해석하는 편이 맞습니다."
      : "Public evidence and cohort sample size are both limited, so this is better read as an approximate band than an exact percentile.";
  }

  if (lowConfidence) {
    return locale === "ko"
      ? "공개 근거가 아직 제한적이라 exact 퍼센트보다 대략적인 구간으로 해석하는 편이 맞습니다."
      : "Public evidence is still limited, so this is better read as an approximate band than an exact percentile.";
  }

  if (smallSample) {
    return locale === "ko"
      ? "비교 표본이 아직 작아 exact 퍼센트보다 대략적인 구간으로 해석하는 편이 맞습니다."
      : "The comparison cohort is still small, so this is better read as an approximate band than an exact percentile.";
  }

  return null;
}
