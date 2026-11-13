"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getDictionary,
  getLocalizedPathname,
  getLocalizedResultPath,
  getResultTemplateFromPathname,
} from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);

  function handleChange(nextLocale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lang");
    const template = getResultTemplateFromPathname(pathname);

    const query = params.toString();
    const nextPath = template
      ? getLocalizedResultPath(template, nextLocale)
      : getLocalizedPathname(
          pathname === "/en"
            ? "/"
            : pathname === "/en/result"
              ? "/result"
              : pathname === "/result"
                ? "/result"
                : "/",
          nextLocale,
        );
    router.replace(`${nextPath}${query ? `?${query}` : ""}`, { scroll: false });
  }

  return (
    <div
      aria-label={dict.language.switchLabel}
      className={cn("gp-lang", className)}
      role="group"
    >
      {(["ko", "en"] as Locale[]).map((option) => (
        <button
          aria-pressed={option === locale}
          key={option}
          lang={option}
          onClick={() => handleChange(option)}
          type="button"
        >
          {option === "ko" ? "한국어" : "English"}
        </button>
      ))}
    </div>
  );
}
