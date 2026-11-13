import Link from "next/link";
import { TemplatePreview } from "@/components/home/template-preview";
import { SelfGenerator } from "@/components/home/self-generator";
import { LocaleSuggestion } from "@/components/ui/locale-suggestion";
import { PageEnterScrollTop } from "@/components/ui/page-enter-scroll-top";
import { GitHubAuthStatus } from "@/components/ui/github-auth-status";
import { GitHubAuthFeedback } from "@/components/ui/github-auth-feedback";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { SiteHeader } from "@/components/ui/site-header";
import { SiteFooter } from "@/components/ui/site-footer";
import {
  buildGitHubLoginPath,
  getGitHubSession,
  hasGitHubOAuthConfig,
} from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { hasPrivateRepoPermission } from "@/lib/document-options";
import { buildHomeStructuredData } from "@/lib/seo";
import {
  DEFAULT_SELF_GENERATOR_TEMPLATE,
  parseStoredTemplatePreference,
  SELF_GENERATOR_TEMPLATE_KEY,
} from "@/lib/self-generator-preferences";
import type { Locale, TemplateId } from "@/lib/schemas";
import { cookies } from "next/headers";
import { StructuredData } from "@/components/seo/structured-data";
import { getTemplateGuidePath, guideCopy } from "@/lib/template-guides";

export async function HomePageContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const structuredData = buildHomeStructuredData(locale);
  const session = await getGitHubSession();
  const cookieStore = await cookies();
  const storedTemplate = parseStoredTemplatePreference(
    cookieStore.get(SELF_GENERATOR_TEMPLATE_KEY)?.value,
  );
  const copy = dict.studio;
  const prefix = locale === "en" ? "/en" : "";
  const proof = copy.proof;
  const canSignIn = !session && hasGitHubOAuthConfig();
  return (
    <main className="min-h-screen">
      <PageEnterScrollTop />
      <StructuredData data={structuredData} />
      <div className="gp-container">
        <SiteHeader locale={locale}>
          <a className="gp-hide-narrow" href="#templates">
            {copy.templates}
          </a>
          <Link className="gp-hide-narrow" href={`${prefix}/preview`}>
            {copy.sampleTitle}
          </Link>
          <LanguageToggle locale={locale} />
        </SiteHeader>
        <LocaleSuggestion locale={locale} />
        <section className="gp-hero" aria-labelledby="hero-title">
          <div className="gp-hero-copy">
            <h1 id="hero-title">{copy.title}</h1>
            <p className="gp-hero-lede">{copy.description}</p>
            <div className="gp-hero-actions">
              {session ? (
                <a className="gp-button" href="#generator">
                  {locale === "ko" ? "내 문서 만들기" : "Create my document"}
                </a>
              ) : null}
              {canSignIn ? (
                <a
                  className="gp-button"
                  href={buildGitHubLoginPath(`${prefix}/#generator`)}
                >
                  {dict.home.authSignIn}
                </a>
              ) : null}
              <Link
                className={
                  session || canSignIn ? "gp-text-link" : "gp-button"
                }
                href={`${prefix}/preview`}
              >
                {copy.preview}
              </Link>
            </div>
            <p className="gp-hero-small">{copy.formats}</p>
          </div>
          <figure className="gp-proof-stage" aria-label={proof.label}>
            <div className="gp-sheet">
              <div className="gp-sheet-head" aria-hidden="true">
                <span>{proof.sheetHead}</span>
                <span>{proof.sheetDate}</span>
              </div>
              <p className="gp-sheet-name">{proof.name}</p>
              <p className="gp-sheet-role">{proof.role}</p>
              <p className="gp-sheet-link">{proof.link}</p>
              <div className="gp-sheet-rule" />
              <div className="gp-mark">
                <p className="gp-sheet-text">{proof.intro}</p>
                <p className="gp-note">{proof.introNote}</p>
              </div>
              <p className="gp-sheet-label">{proof.projectsLabel}</p>
              <div className="gp-mark">
                {proof.projects.map(([name, body]) => (
                  <div className="gp-sheet-project" key={name}>
                    <strong>{name}</strong>
                    <p>{body}</p>
                  </div>
                ))}
                <p className="gp-note">{proof.projectsNote}</p>
              </div>
              <p className="gp-sheet-label">{proof.stackLabel}</p>
              <div className="gp-mark">
                <div className="gp-chips">
                  {proof.stack.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <p className="gp-note">{proof.stackNote}</p>
              </div>
              <p className="gp-sheet-label">{proof.jobLabel}</p>
              <div className="gp-mark">
                <div className="gp-sheet-job">
                  {proof.job}
                  <span>{proof.jobDate}</span>
                </div>
                <p className="gp-note">{proof.jobNote}</p>
              </div>
            </div>
          </figure>
        </section>
      </div>
      <div className="gp-container">
        <GitHubAuthFeedback locale={locale} />
        <GitHubAuthStatus locale={locale} />
        {session ? (
          <SelfGenerator
            canReadPrivate={hasPrivateRepoPermission(session.scopes)}
            loginHref={buildGitHubLoginPath(`${prefix}/#generator`)}
            privateLoginHref={buildGitHubLoginPath(
              `${prefix}/#generator`,
              "private",
            )}
            initialTemplate={storedTemplate ?? DEFAULT_SELF_GENERATOR_TEMPLATE}
            locale={locale}
            username={session.user.login}
          />
        ) : null}
        <section className="gp-section" aria-labelledby="steps-title">
          <div className="gp-section-head">
            <h2 id="steps-title">{copy.stepsTitle}</h2>
          </div>
          <ol className="gp-steps mt-8">
            {[
              [copy.stepOne, copy.stepOneBody],
              [copy.stepTwo, copy.stepTwoBody],
              [copy.stepThree, copy.stepThreeBody],
            ].map(([title, body]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section
          id="templates"
          className="gp-section"
          aria-labelledby="templates-title"
        >
          <div className="gp-section-head">
            <h2 id="templates-title">{copy.templateTitle}</h2>
            <p>{copy.templateHint}</p>
          </div>
          <div className="gp-shelf">
            {(["brief", "profile", "insight", "resume"] as TemplateId[]).map(
              (id) => (
                <Link
                  className="gp-shelf-item"
                  key={id}
                  href={getTemplateGuidePath(id, locale)}
                >
                  <span className="gp-shelf-paper">
                    <TemplatePreview locale={locale} template={id} />
                  </span>
                  <h3>{dict.templateMeta[id].label}</h3>
                  <p>{dict.templateMeta[id].description}</p>
                  <p className="gp-shelf-for">{copy.templateFor[id]}</p>
                </Link>
              ),
            )}
          </div>
        </section>
        <section className="gp-section" aria-labelledby="ledger-title">
          <div className="gp-section-head">
            <h2 id="ledger-title">{copy.ledgerTitle}</h2>
            <p>{copy.ledgerIntro}</p>
          </div>
          <div className="gp-ledger">
            <div>
              <h3>{copy.ledgerInTitle}</h3>
              <ul>
                {copy.ledgerIn.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="gp-ledger-out">
              <h3>{copy.ledgerOutTitle}</h3>
              <ul>
                {copy.ledgerOut.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="gp-ledger-note">{copy.ledgerNote}</p>
            </div>
          </div>
        </section>
        <section className="gp-section" aria-labelledby="formats-title">
          <div className="gp-section-head">
            <h2 id="formats-title">{copy.formatTitle}</h2>
            <p>{copy.formatSubtitle}</p>
          </div>
          <dl className="gp-formats">
            {[
              ["PDF", ".pdf", copy.pdfUse, copy.pdfDescription],
              ["Word", ".docx", copy.wordUse, copy.wordDescription],
              ["HTML", ".html", copy.htmlUse, copy.htmlDescription],
            ].map(([name, extension, use, description]) => (
              <div key={name}>
                <dt>
                  {name}
                  <span>{extension}</span>
                </dt>
                <dd>{use}</dd>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="gp-section" aria-labelledby="faq-title">
          <div className="gp-section-head">
            <h2 id="faq-title">{guideCopy[locale].faqTitle}</h2>
          </div>
          <div className="gp-faq">
            {guideCopy[locale].faq.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <SiteFooter locale={locale} />
      </div>
    </main>
  );
}
