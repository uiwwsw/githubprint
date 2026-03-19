import { getDictionary } from "@/lib/i18n";
import type { Locale, TemplateId } from "@/lib/schemas";
import { PRODUCT_NAME, PRODUCT_SLUG } from "@/lib/brand";

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatDatePart(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? "document"
    : date.toISOString().slice(0, 10);
}

export function buildResultDocumentTitle({
  locale,
  template,
  username,
}: {
  locale: Locale;
  template?: TemplateId;
  username?: string;
}) {
  const dict = getDictionary(locale);
  const templateLabel = template ? dict.templateMeta[template].label : undefined;

  if (username && templateLabel) {
    return locale === "ko"
      ? `${username} ${templateLabel} 문서 | ${PRODUCT_NAME}`
      : `${username} ${templateLabel} document | ${PRODUCT_NAME}`;
  }

  if (username) {
    return locale === "ko"
      ? `${username} 결과 문서 | ${PRODUCT_NAME}`
      : `${username} result document | ${PRODUCT_NAME}`;
  }

  return dict.metadata.resultTitle;
}

export function buildDownloadFileName({
  generatedAt,
  template,
  username,
}: {
  generatedAt: string;
  template: TemplateId;
  username?: string;
}) {
  const parts = [
    PRODUCT_SLUG,
    username ? sanitizeFileNamePart(username) : null,
    sanitizeFileNamePart(template),
    formatDatePart(generatedAt),
  ].filter((part): part is string => Boolean(part));

  return parts.join("-");
}
