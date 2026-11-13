"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildProductStorageKey } from "@/lib/brand";
import { getLocalizedPathname, resolveLocaleFromAcceptLanguage } from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";

const STORAGE_KEY = buildProductStorageKey("locale-suggestion-dismissed");

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
          message: "Your browser is set to English.",
          action: "Go to English",
          dismiss: "Dismiss",
        }
      : {
          message: "브라우저 언어가 한국어입니다.",
          action: "한국어 보기",
          dismiss: "닫기",
        };

  return (
    <div className="gp-notice mb-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p>{copy.message}</p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Link
          className="gp-button gp-button-small"
          href={href}
        >
          {copy.action}
        </Link>
        <button
          className="gp-button gp-button-small gp-button-quiet"
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
