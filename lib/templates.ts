import type { Locale, TemplateId } from "@/lib/schemas";
import { getDictionary } from "@/lib/i18n";

export function getTemplateMeta(locale: Locale) {
  return getDictionary(locale).templateMeta satisfies Record<
    TemplateId,
    {
      id?: TemplateId;
      label: string;
      shortLabel: string;
      description: string;
      emphasis: string;
    }
  >;
}
