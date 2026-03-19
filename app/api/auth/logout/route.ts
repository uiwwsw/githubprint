import { NextRequest, NextResponse } from "next/server";
import { GITHUB_SESSION_COOKIE_NAME, sanitizeRedirectPath } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
  );
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  response.cookies.delete(GITHUB_SESSION_COOKIE_NAME);

  return response;
}
