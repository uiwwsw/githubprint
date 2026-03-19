import { NextRequest, NextResponse } from "next/server";
import {
  buildGitHubAuthorizeUrl,
  createGitHubAuthStateValue,
  createGitHubOAuthState,
  GITHUB_STATE_COOKIE_NAME,
  GITHUB_STATE_MAX_AGE_SECONDS,
  hasGitHubOAuthConfig,
  sanitizeRedirectPath,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
  );

  if (!hasGitHubOAuthConfig()) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const state = createGitHubOAuthState();
  const response = NextResponse.redirect(buildGitHubAuthorizeUrl(state));

  response.cookies.set({
    name: GITHUB_STATE_COOKIE_NAME,
    value: createGitHubAuthStateValue({ redirectTo, state }),
    httpOnly: true,
    maxAge: GITHUB_STATE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
