"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalizedPathname, resolveLocaleFromAcceptLanguage } from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";

const STORAGE_KEY = "gitfolio-locale-suggestion-dismissed";

export function LocaleSuggestion({ locale }: { locale: Locale }) {
  const [preferredLocale, setPreferredLocale] = useState<Locale | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const dismissedState = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    const browserLocale = resolveLocaleFromAcceptLanguage(navigator.language);

    setDismissed(dismissedState);
    setPreferredLocale(browserLocale);
  }, []);

  if (!preferredLocale || preferredLocale === locale || dismissed) {
    return null;
  }

  const href = getLocalizedPathname("/", preferredLocale);
  const copy =
    preferredLocale === "en"
      ? {
          message: "English detected in your browser.",
          action: "Go to English",
          dismiss: "Dismiss",
        }
      : {
          message: "브라우저 언어가 한국어로 감지되었습니다.",
          action: "한국어 보기",
          dismiss: "닫기",
        };

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/[0.08] bg-white/70 px-4 py-3 text-sm text-neutral-700 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.4)]">
      <p>{copy.message}</p>
      <div className="flex items-center gap-2">
        <Link
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 px-4 text-xs font-medium whitespace-nowrap text-white shadow-[0_14px_28px_-20px_rgba(0,0,0,0.7)] transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15"
          href={href}
        >
          {copy.action}
        </Link>
        <button
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-black/[0.08] px-4 text-xs font-medium whitespace-nowrap text-neutral-600 transition hover:bg-white/70"
          onClick={() => {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          type="button"
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
