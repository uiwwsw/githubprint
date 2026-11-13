import Link from "next/link";
import { SelfGenerator } from "@/components/home/self-generator";
import type { DocumentOptions } from "@/lib/document-options";
import { DocumentShell, MetaRibbon } from "@/components/result/document-shell";
import { ResumeActivationPanel } from "@/components/resume/resume-activation-panel";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { getResumeCopy } from "@/lib/resume-copy";
import type { ResumeTemplateAvailability } from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

type ResumeResultStateProps = {
  availability: Exclude<ResumeTemplateAvailability, { state: "ready" }>;
  locale: Locale;
  recovery?: {
    username: string;
    canReadPrivate: boolean;
    privateLoginHref: string;
    loginHref: string;
    initialOptions: DocumentOptions;
  };
};

export function ResumeResultState({
  availability,
  locale,
  recovery,
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
          <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-ink">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-ink">
            {message}
          </p>
        </div>

        {recovery && availability.state === "locked_missing_repo" ? (
          <div className="screen-only">
            <SelfGenerator
              {...recovery}
              initialTemplate="resume"
              resumeOnly
              locale={locale}
            />
          </div>
        ) : (
          <ResumeActivationPanel availability={availability} locale={locale} />
        )}

        <div className="screen-only flex gap-3">
          <Link
className="gp-button gp-button-quiet"
            href={homeHref}
          >
            {dict.result.backHome}
          </Link>
        </div>
      </div>
    </DocumentShell>
  );
}
