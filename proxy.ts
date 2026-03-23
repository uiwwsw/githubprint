import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getLocalizedPathname, resolveLocale } from "@/lib/i18n";

const handleI18nRouting = createMiddleware(routing);

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

  if (langParam && !isApiRoute) {
    const locale = resolveLocale(langParam);
    const redirectUrl = nextUrl.clone();
    const isResultIndexPath = pathname === "/result" || pathname === "/en/result";

    redirectUrl.pathname = getLocalizedPathname(isResultIndexPath ? "/result" : "/", locale);
    redirectUrl.searchParams.delete("lang");

    return NextResponse.redirect(redirectUrl);
  }

  if (isApiRoute) {
    return NextResponse.next();
  }

  const response = handleI18nRouting(request);

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
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
