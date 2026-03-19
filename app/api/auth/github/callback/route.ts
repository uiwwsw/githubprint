import { NextRequest, NextResponse } from "next/server";
import {
  createGitHubSessionValue,
  exchangeGitHubCodeForSession,
  GITHUB_SESSION_COOKIE_NAME,
  GITHUB_SESSION_MAX_AGE_SECONDS,
  GITHUB_STATE_COOKIE_NAME,
  hasGitHubOAuthConfig,
  readGitHubAuthState,
  sanitizeRedirectPath,
} from "@/lib/auth";
import {
  detectLocaleFromPathname,
  getLocalizedPathname,
} from "@/lib/i18n";

function buildRedirectUrl(request: NextRequest, redirectTo?: string | null) {
  return new URL(sanitizeRedirectPath(redirectTo), request.url);
}

function shouldAutoOpenSelfResult(redirectTo?: string | null) {
  const normalized = sanitizeRedirectPath(redirectTo);
  return normalized === "/" || normalized === "/en";
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = readGitHubAuthState(
    request.cookies.get(GITHUB_STATE_COOKIE_NAME)?.value,
  );
  const redirectUrl = buildRedirectUrl(request, savedState?.redirectTo);

  if (!hasGitHubOAuthConfig() || error || !code || !state || !savedState) {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(GITHUB_STATE_COOKIE_NAME);
    return response;
  }

  if (savedState.state !== state) {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(GITHUB_STATE_COOKIE_NAME);
    return response;
  }

  try {
    const session = await exchangeGitHubCodeForSession(code);
    const locale = detectLocaleFromPathname(savedState.redirectTo ?? "/");
    const finalRedirectUrl = shouldAutoOpenSelfResult(savedState.redirectTo)
      ? new URL(
          `${getLocalizedPathname("/result", locale)}?url=${encodeURIComponent(session.user.login)}&template=profile`,
          request.url,
        )
      : redirectUrl;
    const response = NextResponse.redirect(finalRedirectUrl);

    response.cookies.set({
      name: GITHUB_SESSION_COOKIE_NAME,
      value: createGitHubSessionValue(session),
      httpOnly: true,
      maxAge: GITHUB_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.delete(GITHUB_STATE_COOKIE_NAME);

    return response;
  } catch {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(GITHUB_STATE_COOKIE_NAME);
    response.cookies.delete(GITHUB_SESSION_COOKIE_NAME);
    return response;
  }
}
