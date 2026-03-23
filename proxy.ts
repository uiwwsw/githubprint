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
  const locale = isApiRoute && langParam
    ? resolveLocale(langParam)
    : detectLocaleFromPathname(pathname);
  const requestHeaders = withLocaleHeader(request, locale);

  if (langParam && !isApiRoute) {
    const redirectUrl = nextUrl.clone();
    const isResultPath = pathname === "/result" || pathname === "/en/result";

    redirectUrl.pathname = getLocalizedPathname(isResultPath ? "/result" : "/", locale);
    redirectUrl.searchParams.delete("lang");

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
