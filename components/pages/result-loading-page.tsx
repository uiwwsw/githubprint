import { ResultLoading } from "@/components/result/result-loading";
import type { Locale } from "@/lib/schemas";

export function ResultLoadingPageContent({ locale }: { locale: Locale }) {
  return <ResultLoading locale={locale} />;
}
