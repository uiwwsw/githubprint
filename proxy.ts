import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { detectLocaleFromPathname, getLocalizedPathname, resolveLocale } from "@/lib/i18n";

function withLocaleHeader(request: NextRequest, locale: "ko" | "en") {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-gitfolio-locale", locale);
  return requestHeaders;
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  if (nextUrl.searchParams.has("lang")) {
    const locale = resolveLocale(nextUrl.searchParams.get("lang"));
    const redirectUrl = nextUrl.clone();
    const isResultPath = pathname === "/result" || pathname === "/en/result";

    redirectUrl.pathname = getLocalizedPathname(isResultPath ? "/result" : "/", locale);
    redirectUrl.searchParams.delete("lang");

    return NextResponse.redirect(redirectUrl);
  }

  const locale = detectLocaleFromPathname(pathname);
  const requestHeaders = withLocaleHeader(request, locale);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
