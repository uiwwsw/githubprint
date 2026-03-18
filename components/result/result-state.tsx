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
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">{dict.result.stateEyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-neutral-950">{title}</h1>
        </div>
        <p className="max-w-2xl text-[15px] leading-7 text-neutral-700">{message}</p>
        {detail ? <p className="text-sm leading-6 text-neutral-500">{detail}</p> : null}
        <div className="screen-only flex gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white"
            href={href}
          >
            {dict.result.backHome}
          </Link>
        </div>
      </div>
    </DocumentShell>
  );
}
