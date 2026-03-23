import type { Metadata } from "next";
import { buildGitHubLogoutPath, getGitHubSession } from "@/lib/auth";
import { analyzeGitHubSource } from "@/lib/analyze";
import { GitHubFetchError, getGitHubSource } from "@/lib/github";
import { readEnv } from "@/lib/env";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { RequestThrottleError, assertResultRequestAllowed } from "@/lib/request-throttle";
import { getResumeCopy } from "@/lib/resume-copy";
import { getResumeTemplateAvailability } from "@/lib/resume-source";
import { buildResultMetadata } from "@/lib/seo";
import {
  resultSearchParamsSchema,
  type Locale,
  type PrivateExposureMode,
  type TemplateId,
} from "@/lib/schemas";
import { ResultActions } from "@/components/result/result-actions";
import { RenderTemplate } from "@/components/result/render-template";
import { ResumeResultState } from "@/components/result/resume-result-state";
import { ResultState } from "@/components/result/result-state";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { LocaleSync } from "@/components/ui/locale-sync";

export type ResultPageSearchParams = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorPresentation(error: unknown, locale: Locale) {
  const dict = getDictionary(locale);

  if (error instanceof GitHubFetchError) {
    if (error.code === "not_found") {
      return {
        title: dict.errors.notFoundTitle,
        message: dict.errors.notFoundMessage,
      };
    }

    if (error.code === "organization") {
      return {
        title: dict.errors.organizationTitle,
        message: dict.errors.organizationMessage,
      };
    }

    if (error.code === "rate_limited") {
      return {
        title: dict.errors.rateLimitTitle,
        message: dict.errors.rateLimitMessage,
        detail: error.resetAt
          ? `${dict.errors.rateLimitResetPrefix}: ${new Date(error.resetAt).toLocaleString(locale === "ko" ? "ko-KR" : "en-US")}`
          : undefined,
      };
    }

    return {
      title: dict.errors.fetchTitle,
      message: dict.errors.fetchMessage,
    };
  }

  if (error instanceof RequestThrottleError) {
    return {
      title: dict.errors.rateLimitTitle,
      message:
        locale === "ko"
          ? "요청이 너무 빠르게 반복되어 잠시 동안 다시 생성이 제한되었습니다."
          : "Requests are being repeated too quickly, so regeneration is temporarily limited.",
      detail: error.retryAt
        ? `${dict.errors.rateLimitResetPrefix}: ${new Date(error.retryAt).toLocaleString(locale === "ko" ? "ko-KR" : "en-US")}`
        : undefined,
    };
  }

  return {
    title: dict.errors.unknownTitle,
    message: dict.errors.unknownMessage,
  };
}

export async function generateResultPageMetadata({
  locale,
  template,
}: {
  locale: Locale;
  template: TemplateId;
}): Promise<Metadata> {
  const session = await getGitHubSession();

  return buildResultMetadata(locale, {
    template,
    username: session?.user.login,
  });
}

export async function ResultPageContent({
  locale,
  searchParams,
  template,
}: ResultPageSearchParams & { locale: Locale; template: TemplateId }) {
  const rawParams = await searchParams;
  const dict = getDictionary(locale);
  const homeHref = getLocalizedPathname("/", locale);
  const session = await getGitHubSession();
  const logoutHref = session
    ? buildGitHubLogoutPath(homeHref)
    : undefined;
  const requestedPrivateInclude =
    getFirstValue(rawParams.private) === "1" ||
    getFirstValue(rawParams.private) === "true";
  const parsed = resultSearchParamsSchema.parse({
    refresh: getFirstValue(rawParams.refresh),
  });

  if (!session) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <LocaleSync locale={locale} />
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="screen-only flex justify-end">
            <LanguageToggle locale={locale} />
          </div>
          <ResultActions
            backHref={homeHref}
            canDownload={false}
            locale={locale}
            mode="fallback"
            template={template}
          />
          <ResultState
            locale={locale}
            message={dict.errors.authRequiredMessage}
            title={dict.errors.authRequiredTitle}
          />
        </div>
      </main>
    );
  }

  try {
    const forceFresh =
      Boolean(parsed.refresh) &&
      (process.env.NODE_ENV !== "production" ||
        readEnv("GITHUBPRINT_ALLOW_RESULT_REFRESH", "GITFOLIO_ALLOW_RESULT_REFRESH") === "1");
    const privateExposureMode: PrivateExposureMode =
      requestedPrivateInclude ? "include" : "aggregate";
    const authContext = {
      accessToken: session.accessToken,
      scopes: session.scopes,
      viewerUsername: session.user.login,
    };
    await assertResultRequestAllowed({ forceFresh });
    const generatedAt = new Date().toISOString();

    if (template === "resume") {
      const availability = await getResumeTemplateAvailability({
        authContext,
        forceFresh,
        locale,
        username: session.user.login,
      });
      const resumeCopy = getResumeCopy(locale);

      return (
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
          <LocaleSync locale={locale} />
          <div className="mx-auto max-w-[1200px] space-y-5">
            <div className="screen-only flex justify-end">
              <LanguageToggle locale={locale} />
            </div>
            <ResultActions
              backHref={homeHref}
              canDownload={availability.state === "ready"}
              downloadFileName={{
                generatedAt,
                template,
                username: session.user.login,
              }}
              locale={locale}
              logoutHref={logoutHref}
              mode="fallback"
              resumeDownloadUrl={`/api/resume-docx?lang=${locale}`}
              resumeRepoVisibility={
                "repoVisibility" in availability
                  ? availability.repoVisibility
                  : undefined
              }
              template={template}
            />
            {availability.state === "ready" ? (
              <>
                {availability.document.warnings.length > 0 ? (
                  <section className="screen-only rounded-[1.25rem] border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    <p className="font-medium">
                      {resumeCopy.resultState.warningTitle}
                    </p>
                    <p className="mt-1 leading-6">
                      {resumeCopy.resultState.warningMessage}
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      {availability.document.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                <RenderTemplate
                  avatarUrl={session.user.avatarUrl}
                  generatedAt={generatedAt}
                  locale={locale}
                  profileUrl={session.user.profileUrl}
                  resumeDocument={availability.document}
                  template="resume"
                />
              </>
            ) : (
              <ResumeResultState availability={availability} locale={locale} />
            )}
          </div>
        </main>
      );
    }

    const source = await getGitHubSource(session.user.login, {
      authContext,
      forceFresh,
      locale,
      privateExposureMode,
    });
    const analysisResult = await analyzeGitHubSource(source, {
      forceFresh,
      locale,
    });

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <LocaleSync locale={locale} />
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="screen-only flex justify-end">
            <LanguageToggle locale={locale} />
          </div>
          <ResultActions
            backHref={homeHref}
            dataMode={source.dataMode}
            downloadFileName={{
              generatedAt,
              template,
              username: session.user.login,
            }}
            locale={locale}
            logoutHref={logoutHref}
            mode={analysisResult.mode}
            privateExposureMode={source.privateExposureMode}
            template={template}
          />
          <RenderTemplate
            analysisResult={analysisResult}
            authorizedPrivateInsights={source.authorizedPrivateInsights}
            contributionSummary={source.activity.contributionSummary}
            dataMode={source.dataMode}
            generatedAt={generatedAt}
            locale={locale}
            privateExposureMode={source.privateExposureMode}
            profileUrl={session.user.profileUrl}
            template={template}
          />
        </div>
      </main>
    );
  } catch (error) {
    const presentation = getErrorPresentation(error, locale);

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <LocaleSync locale={locale} />
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="screen-only flex justify-end">
            <LanguageToggle locale={locale} />
          </div>
          <ResultActions
            backHref={homeHref}
            canDownload={false}
            locale={locale}
            logoutHref={logoutHref}
            mode="fallback"
            template={template}
          />
          <ResultState
            detail={presentation.detail}
            locale={locale}
            message={presentation.message}
            title={presentation.title}
          />
        </div>
      </main>
    );
  }
}
