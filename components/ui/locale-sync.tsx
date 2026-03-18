"use client";

import { useEffect } from "react";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";

export function LocaleSync({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  useEffect(() => {
    document.documentElement.lang = dict.htmlLang;
  }, [dict.htmlLang]);

  return null;
}
