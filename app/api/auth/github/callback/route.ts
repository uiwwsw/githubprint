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
import { hasPrivateRepoPermission } from "@/lib/document-options";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = readGitHubAuthState(
    request.cookies.get(GITHUB_STATE_COOKIE_NAME)?.value,
  );
  const redirectUrl = new URL(
    sanitizeRedirectPath(savedState?.redirectTo),
    request.url,
  );
  function redirect(
    outcome: "connected" | "cancelled" | "failed" | "expired" | "permission",
  ) {
    redirectUrl.searchParams.set("github_auth", outcome);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: GITHUB_STATE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    return response;
  }
  if (!hasGitHubOAuthConfig()) return redirect("failed");
  if (error)
    return redirect(error === "access_denied" ? "cancelled" : "failed");
  if (!code || !state || !savedState || savedState.state !== state)
    return redirect("expired");
  try {
    const session = await exchangeGitHubCodeForSession(code);
    const response = redirect(
      savedState.access === "private" &&
        !hasPrivateRepoPermission(session.scopes)
        ? "permission"
        : "connected",
    );
    response.cookies.set({
      name: GITHUB_SESSION_COOKIE_NAME,
      value: createGitHubSessionValue(session),
      httpOnly: true,
      maxAge: GITHUB_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    // Keep the previous session on failure, and explain why the upgrade did not complete.
    return redirect("failed");
  }
}
