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
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/80 p-1 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.5)]",
        className,
      )}
      role="group"
    >
      {(["ko", "en"] as Locale[]).map((option) => {
        const active = option === locale;
        return (
          <button
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-black/[0.04]",
            )}
            key={option}
            onClick={() => handleChange(option)}
            type="button"
          >
            {dict.language[option]}
          </button>
        );
      })}
    </div>
  );
}
