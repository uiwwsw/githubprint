import Link from "next/link";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { ResumeActivationPanel } from "@/components/resume/resume-activation-panel";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { getResumeCopy } from "@/lib/resume-copy";
import type { ResumeTemplateAvailability } from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

type ResumeResultStateProps = {
  availability: Exclude<ResumeTemplateAvailability, { state: "ready" }>;
  locale: Locale;
};

export function ResumeResultState({
  availability,
  locale,
}: ResumeResultStateProps) {
  const dict = getDictionary(locale);
  const copy = getResumeCopy(locale);
  const homeHref = getLocalizedPathname("/", locale);
  const title =
    availability.state === "locked_invalid_schema"
      ? copy.resultState.invalidTitle
      : copy.resultState.missingTitle;
  const message =
    availability.state === "locked_invalid_schema"
      ? copy.resultState.invalidMessage
      : copy.resultState.missingMessage;

  return (
    <DocumentShell
      accent={
        <MetaRibbon
          label={dict.result.stateStatusLabel}
          value={locale === "ko" ? "Resume 차단" : "Resume blocked"}
        />
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
            Resume
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-neutral-950">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-neutral-700">
            {message}
          </p>
        </div>

        <ResumeActivationPanel availability={availability} locale={locale} />

        <div className="screen-only flex gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white"
            href={homeHref}
          >
            {dict.result.backHome}
          </Link>
        </div>
      </div>
    </DocumentShell>
  );
}
