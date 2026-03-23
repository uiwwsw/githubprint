import { SelfGenerator } from "@/components/home/self-generator";
import { LocaleSuggestion } from "@/components/ui/locale-suggestion";
import { GitHubAuthStatus } from "@/components/ui/github-auth-status";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { LocaleSync } from "@/components/ui/locale-sync";
import { getGitHubSession } from "@/lib/auth";
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
import type { Locale } from "@/lib/schemas";
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
  const hasStoredPreferences = storedTemplate !== null || storedPrivate !== null;
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
    resumeAvailability ?? (session ? { state: "locked_missing_repo" as const } : null);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      {structuredData.map((entry) => (
        <script
          key={`${entry["@type"]}-${locale}`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          type="application/ld+json"
        />
      ))}
      <LocaleSync locale={locale} />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center">
        <div className="mb-8 flex w-full justify-end">
          <LanguageToggle locale={locale} />
        </div>
        <div className="w-full max-w-4xl">
          <LocaleSuggestion locale={locale} />
        </div>
        <div className="max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
            {dict.home.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,5.8rem)] leading-[0.96] tracking-[-0.04em] text-neutral-950">
            {dict.home.titleTop}
            <br />
            {dict.home.titleBottom}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-8 text-neutral-600">
            {dict.home.description}
          </p>
        </div>

        <div className="mt-12 w-full">
          <GitHubAuthStatus locale={locale} />
        </div>
        {session ? (
          <div className="w-full">
            <SelfGenerator
              hasStoredPreferences={hasStoredPreferences}
              initialIncludePrivate={storedPrivate ?? false}
              initialTemplate={
                storedTemplate ?? DEFAULT_SELF_GENERATOR_TEMPLATE
              }
              locale={locale}
              resumeAvailability={resolvedResumeAvailability}
              username={session.user.login}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
