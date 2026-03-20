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

function buildRedirectUrl(request: NextRequest, redirectTo?: string | null) {
  return new URL(sanitizeRedirectPath(redirectTo), request.url);
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
    response.cookies.set({
      name: GITHUB_STATE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  if (savedState.state !== state) {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: GITHUB_STATE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  try {
    const session = await exchangeGitHubCodeForSession(code);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
      name: GITHUB_SESSION_COOKIE_NAME,
      value: createGitHubSessionValue(session),
      httpOnly: true,
      maxAge: GITHUB_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set({
      name: GITHUB_STATE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: GITHUB_STATE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    response.cookies.set({
      name: GITHUB_SESSION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    return response;
  }
}
