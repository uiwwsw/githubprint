import type { Metadata } from "next";
import { buildGitHubLogoutPath, getGitHubSession } from "@/lib/auth";
import { analyzeGitHubSource } from "@/lib/analyze";
import { GitHubFetchError, getGitHubSource } from "@/lib/github";
import { readEnv } from "@/lib/env";
import { GitHubUrlError, normalizeGitHubUrlInput } from "@/lib/github-url";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { RequestThrottleError, assertResultRequestAllowed } from "@/lib/request-throttle";
import { buildResultMetadata } from "@/lib/seo";
import {
  resultSearchParamsSchema,
  type Locale,
  type PrivateExposureMode,
  type TemplateId,
  templateSchema,
} from "@/lib/schemas";
import { ResultActions } from "@/components/result/result-actions";
import { RenderTemplate } from "@/components/result/render-template";
import { ResultState } from "@/components/result/result-state";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { LocaleSync } from "@/components/ui/locale-sync";

export type ResultPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorPresentation(error: unknown, locale: Locale) {
  const dict = getDictionary(locale);

  if (error instanceof GitHubUrlError) {
    return {
      title: dict.errors.invalidUrlTitle,
      message: error.message,
    };
  }

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
  searchParams,
}: ResultPageProps & { locale: Locale }): Promise<Metadata> {
  const params = await searchParams;
  const url = getFirstValue(params.url);
  const rawTemplate = getFirstValue(params.template);
  const templateResult = templateSchema.safeParse(rawTemplate);
  const template = templateResult.success ? templateResult.data : undefined;

  if (!url) {
    return buildResultMetadata(locale, { template });
  }

  try {
    const normalized = normalizeGitHubUrlInput(url, locale);
    return buildResultMetadata(locale, {
      template,
      username: normalized.username,
    });
  } catch {
    return buildResultMetadata(locale, { template });
  }
}

export async function ResultPageContent({
  locale,
  searchParams,
}: ResultPageProps & { locale: Locale }) {
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
  const parsed = resultSearchParamsSchema.safeParse({
    refresh: getFirstValue(rawParams.refresh),
    template: getFirstValue(rawParams.template),
    url: getFirstValue(rawParams.url),
  });

  const template: TemplateId = parsed.success ? parsed.data.template : "profile";

  if (!parsed.success) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <LocaleSync locale={locale} />
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="flex justify-end">
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
            locale={locale}
            message={dict.errors.invalidSearchMessage}
            title={dict.errors.invalidSearchTitle}
          />
        </div>
      </main>
    );
  }

  try {
    const normalized = normalizeGitHubUrlInput(parsed.data.url, locale);
    const forceFresh =
      Boolean(parsed.data.refresh) &&
      (process.env.NODE_ENV !== "production" ||
        readEnv("GITHUBPRINT_ALLOW_RESULT_REFRESH", "GITFOLIO_ALLOW_RESULT_REFRESH") === "1");
    const authContext =
      session &&
      session.user.login.toLowerCase() === normalized.username.toLowerCase()
        ? {
            accessToken: session.accessToken,
            scopes: session.scopes,
            viewerUsername: session.user.login,
          }
        : undefined;
    const privateExposureMode: PrivateExposureMode =
      authContext && requestedPrivateInclude ? "include" : "aggregate";
    await assertResultRequestAllowed({ forceFresh });
    const source = await getGitHubSource(normalized.username, {
      authContext,
      forceFresh,
      locale,
      privateExposureMode,
    });
    const analysisResult = await analyzeGitHubSource(source, {
      forceFresh,
      locale,
    });
    const generatedAt = new Date().toISOString();

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <LocaleSync locale={locale} />
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="flex justify-end">
            <LanguageToggle locale={locale} />
          </div>
          <ResultActions
            backHref={homeHref}
            dataMode={source.dataMode}
            downloadFileName={{
              generatedAt,
              template: parsed.data.template,
              username: normalized.username,
            }}
            locale={locale}
            logoutHref={logoutHref}
            mode={analysisResult.mode}
            privateExposureMode={source.privateExposureMode}
            template={parsed.data.template}
          />
          <RenderTemplate
            analysisResult={analysisResult}
            authorizedPrivateInsights={source.authorizedPrivateInsights}
            contributionSummary={source.activity.contributionSummary}
            dataMode={source.dataMode}
            generatedAt={generatedAt}
            locale={locale}
            privateExposureMode={source.privateExposureMode}
            profileUrl={normalized.canonicalProfileUrl}
            template={parsed.data.template}
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
          <div className="flex justify-end">
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
