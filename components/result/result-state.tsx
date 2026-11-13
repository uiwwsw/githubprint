import Link from "next/link";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import type { Locale } from "@/lib/schemas";

export function ResultState({
  title,
  message,
  detail,
  locale,
}: {
  title: string;
  message: string;
  detail?: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const href = getLocalizedPathname("/", locale);

  return (
    <DocumentShell accent={<MetaRibbon label={dict.result.stateStatusLabel} value={dict.result.stateStatusValue} />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-ink">{title}</h1>
        </div>
        <p className="max-w-2xl text-[15px] leading-7 text-ink">{message}</p>
        {detail ? <p className="text-sm leading-6 text-ink-soft">{detail}</p> : null}
        <div className="screen-only flex gap-3">
          <Link
className="gp-button gp-button-quiet"
            href={href}
          >
            {dict.result.backHome}
          </Link>
        </div>
      </div>
    </DocumentShell>
  );
}
