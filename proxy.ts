import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  LEGACY_LOCALE_HEADER_NAME,
  LOCALE_HEADER_NAME,
} from "@/lib/brand";
import { detectLocaleFromPathname, getLocalizedPathname, resolveLocale } from "@/lib/i18n";

function withLocaleHeader(request: NextRequest, locale: "ko" | "en") {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, locale);
  requestHeaders.set(LEGACY_LOCALE_HEADER_NAME, locale);
  return requestHeaders;
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const langParam = nextUrl.searchParams.get("lang");
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const isResultPath =
    pathname === "/result" ||
    pathname.startsWith("/result/") ||
    pathname === "/en/result" ||
    pathname.startsWith("/en/result/");
  const locale = isApiRoute && langParam
    ? resolveLocale(langParam)
    : detectLocaleFromPathname(pathname);
  const requestHeaders = withLocaleHeader(request, locale);

  if (langParam && !isApiRoute) {
    const redirectUrl = nextUrl.clone();
    const isResultIndexPath = pathname === "/result" || pathname === "/en/result";

    redirectUrl.pathname = getLocalizedPathname(isResultIndexPath ? "/result" : "/", locale);
    redirectUrl.searchParams.delete("lang");

    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isResultPath) {
    // Result pages are private to the signed-in user and should never appear in search.
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex",
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
