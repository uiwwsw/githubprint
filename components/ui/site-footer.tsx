import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale).studio;
  const prefix = locale === "en" ? "/en" : "";
  return (
    <footer className="gp-footer screen-only">
      <p>
        <strong className="text-ink">GitHubPrint</strong>
        <span className="ml-3">{copy.footer}</span>
      </p>
      <nav aria-label="GitHubPrint">
        <Link href={`${prefix}/preview`}>{copy.sampleTitle}</Link>
        <Link href={`${prefix}/showcase`}>{copy.showcase}</Link>
        <a href="https://github.com/uiwwsw/githubprint" rel="noreferrer">
          {copy.source}
        </a>
      </nav>
    </footer>
  );
}
