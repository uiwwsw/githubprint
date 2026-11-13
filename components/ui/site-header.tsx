import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/schemas";

/** A printer's registration mark: the sign that a sheet is lined up for print. */
function RegistrationMark() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M11 1v20M1 11h20" />
    </svg>
  );
}

export function Wordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={locale === "en" ? "/en" : "/"} className="gp-wordmark">
      <RegistrationMark />
      GitHubPrint
    </Link>
  );
}

export function SiteHeader({
  locale,
  children,
  label,
}: {
  locale: Locale;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <header className="gp-header screen-only">
      <Wordmark locale={locale} />
      <nav className="gp-header-links" aria-label={label}>
        {children}
      </nav>
    </header>
  );
}

/** Plain links between the two language versions of a page. */
export function LanguageLinks({
  locale,
  koHref,
  enHref,
}: {
  locale: Locale;
  koHref: string;
  enHref: string;
}) {
  return (
    <span className="gp-lang">
      <Link
        href={koHref}
        hrefLang="ko"
        lang="ko"
        aria-current={locale === "ko" ? "true" : undefined}
      >
        한국어
      </Link>
      <Link
        href={enHref}
        hrefLang="en"
        lang="en"
        aria-current={locale === "en" ? "true" : undefined}
      >
        English
      </Link>
    </span>
  );
}
