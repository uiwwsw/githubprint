import Link from "next/link";
import { TemplatePreview } from "@/components/home/template-preview";
import { SelfGenerator } from "@/components/home/self-generator";
import { LocaleSuggestion } from "@/components/ui/locale-suggestion";
import { PageEnterScrollTop } from "@/components/ui/page-enter-scroll-top";
import { GitHubAuthStatus } from "@/components/ui/github-auth-status";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  buildGitHubLoginPath,
  getGitHubSession,
  hasGitHubOAuthConfig,
} from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getResumeTemplateAvailability } from "@/lib/resume-source";
import { buildHomeStructuredData } from "@/lib/seo";
import {
  DEFAULT_SELF_GENERATOR_TEMPLATE,
  parseStoredPrivatePreference,
  parseStoredTemplatePreference,
  SELF_GENERATOR_PRIVATE_KEY,
  SELF_GENERATOR_TEMPLATE_KEY,
} from "@/lib/self-generator-preferences";
import type { Locale, TemplateId } from "@/lib/schemas";
import { cookies } from "next/headers";

export async function HomePageContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const structuredData = buildHomeStructuredData(locale);
  const session = await getGitHubSession();
  const cookieStore = await cookies();
  const storedTemplate = parseStoredTemplatePreference(
    cookieStore.get(SELF_GENERATOR_TEMPLATE_KEY)?.value,
  );
  const storedPrivate = parseStoredPrivatePreference(
    cookieStore.get(SELF_GENERATOR_PRIVATE_KEY)?.value,
  );
  const hasStoredPreferences =
    storedTemplate !== null || storedPrivate !== null;
  const resumeAvailability = session
    ? await getResumeTemplateAvailability({
        authContext: {
          accessToken: session.accessToken,
          scopes: session.scopes,
          viewerUsername: session.user.login,
        },
        locale,
        username: session.user.login,
      }).catch(() => null)
    : null;
  const resolvedResumeAvailability =
    resumeAvailability ??
    (session ? { state: "locked_missing_repo" as const } : null);

  const copy = dict.studio;
  const prefix = locale === "en" ? "/en" : "";
  return (
    <main className="studio-home min-h-screen">
      <PageEnterScrollTop />
      {structuredData.map((entry) => (
        <script
          key={`${entry["@type"]}-${locale}`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          type="application/ld+json"
        />
      ))}
      <div className="studio-container">
        <nav className="studio-nav">
          <Link href={`${prefix}/`} className="brand-wordmark">
            <span className="brand-mark">G/</span>GitHubPrint
          </Link>
          <div className="flex items-center gap-6">
            <a
              className="hidden text-sm text-neutral-500 sm:block"
              href="#templates"
            >
              {copy.templates}
            </a>
            <LanguageToggle locale={locale} />
          </div>
        </nav>
        <LocaleSuggestion locale={locale} />
        <section className="studio-hero">
          <div className="studio-hero-copy">
            <p className="studio-eyebrow">
              <span className="status-dot" />
              {copy.eyebrow}
            </p>
            <h1>
              {copy.titleTop}
              <br />
              <span>{copy.titleBottom}</span>
            </h1>
            <p className="studio-description">{copy.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {!session && hasGitHubOAuthConfig() ? (
                <a
                  className="studio-cta"
                  href={buildGitHubLoginPath(`${prefix}/`)}
                >
                  {dict.home.authSignIn}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <Link
                className={
                  !session && hasGitHubOAuthConfig()
                    ? "text-sm text-neutral-600 underline underline-offset-4"
                    : "studio-cta"
                }
                href={`${prefix}/preview`}
              >
                {copy.preview}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className="mt-5 text-xs tracking-wide text-neutral-500">
              {copy.formats}
            </p>
          </div>
          <div className="hero-paper-stage">
            <div className="hero-paper-back" />
            <TemplatePreview locale={locale} template="resume" hero />
            <span className="paper-caption">01 — RESUME</span>
          </div>
        </section>
        <div className="studio-steps">
          {[
            [copy.stepOne, copy.stepOneBody],
            [copy.stepTwo, copy.stepTwoBody],
            [copy.stepThree, copy.stepThreeBody],
          ].map(([title, body], index) => (
            <div key={title}>
              <span className="step-index">0{index + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="my-10">
          <GitHubAuthStatus locale={locale} />
        </div>
        {session ? (
          <SelfGenerator
            hasStoredPreferences={hasStoredPreferences}
            initialIncludePrivate={storedPrivate ?? false}
            initialTemplate={storedTemplate ?? DEFAULT_SELF_GENERATOR_TEMPLATE}
            locale={locale}
            resumeAvailability={resolvedResumeAvailability}
            username={session.user.login}
          />
        ) : null}
        <section id="templates" className="studio-templates">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="studio-eyebrow">A FORMAT FOR EVERY STORY</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {copy.templates}
              </h2>
            </div>
            <p className="text-sm text-neutral-500">{copy.templateHint}</p>
          </div>
          <div className="template-gallery">
            {(["brief", "profile", "insight", "resume"] as TemplateId[]).map(
              (id, index) => (
                <Link
                  className="template-gallery-card"
                  key={id}
                  href={`${prefix}/preview?template=${id}`}
                  aria-label={`${dict.templateMeta[id].label} — ${copy.openExample}`}
                >
                  <div
                    className={`template-thumbnail template-thumbnail-${id}`}
                  >
                    <TemplatePreview locale={locale} template={id} />
                  </div>
                  <div className="flex items-baseline justify-between pt-5">
                    <h3>{dict.templateMeta[id].label}</h3>
                    <span className="text-xs text-neutral-400">
                      0{index + 1} ↗
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {dict.templateMeta[id].description}
                  </p>
                </Link>
              ),
            )}
          </div>
        </section>
        <footer className="studio-footer">
          <span className="font-semibold text-neutral-700">GitHubPrint</span>
          <p>{copy.footer}</p>
          <span>PDF & DOCX</span>
        </footer>
      </div>
    </main>
  );
}
