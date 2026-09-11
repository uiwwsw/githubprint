"use client";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/schemas";
const messages = {
  connected: [
    "GitHub 연결이 완료되었습니다. 아래에서 원본 확인 결과를 확인하고 문서를 생성하세요.",
    "GitHub connection completed. Review the source check below, then generate your document.",
  ],
  cancelled: [
    "GitHub 권한 연결을 취소했습니다. 기존 로그인과 선택한 설정은 유지됩니다.",
    "GitHub access was cancelled. Your existing sign-in and selections are preserved.",
  ],
  failed: [
    "GitHub 연결을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요. 기존 로그인은 유지됩니다.",
    "GitHub connection could not be completed. Try again shortly. Your existing sign-in is preserved.",
  ],
  expired: [
    "로그인 확인 요청이 만료되었거나 일치하지 않습니다. 이 화면에서 GitHub 연결을 다시 시작해 주세요.",
    "The sign-in request expired or did not match. Start GitHub sign-in again from this page.",
  ],
  permission: [
    "GitHub 로그인은 완료됐지만 비공개 저장소 접근 권한이 연결되지 않았습니다. 공개 원본을 사용하거나 비공개 권한을 연결해 주세요.",
    "Sign-in completed, but private repository access was not granted. Use a public source or connect private access.",
  ],
};
export function GitHubAuthFeedback({ locale }: { locale: Locale }) {
  const [outcome, setOutcome] = useState<keyof typeof messages | null>(null);
  useEffect(() => {
    const url = new URL(location.href),
      value = url.searchParams.get("github_auth");
    if (value && Object.hasOwn(messages, value)) {
      setOutcome(value as keyof typeof messages);
      url.searchParams.delete("github_auth");
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
  }, []);
  if (!outcome) return null;
  return (
    <p
      role={outcome === "connected" ? "status" : "alert"}
      className="mb-4 rounded-xl border border-emerald-900/15 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-950"
    >
      {messages[outcome][locale === "ko" ? 0 : 1]}
    </p>
  );
}
