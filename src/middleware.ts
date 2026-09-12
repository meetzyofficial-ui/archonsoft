import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

/**
 * Every page lives under a locale prefix, so anything arriving without one is
 * sent to the default. Doing it here rather than with a redirect page means a
 * mistyped URL still lands on the localised 404 with the full chrome, instead
 * of on a bare framework error page.
 *
 * It also stamps the language onto the request. A `not-found` boundary is the
 * one server component in the App Router that cannot read its own route
 * params, so without this every Turkish visitor who mistyped a URL was
 * answered in English — on a site whose whole point is that both languages are
 * real.
 */
export const LOCALE_HEADER = "x-archon-locale";
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matched = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (matched) {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, matched);
    return NextResponse.next({ request: { headers } });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, the API and the files that must stay at
  // the root: robots, sitemap, icons, fonts and Open Graph images.
  //
  // The backslash has to survive into the compiled string. Written as "\." it
  // collapses to "." — any character — so `.*\..*` became `.*.*`, the negative
  // lookahead excluded every non-empty path, and the middleware only ever ran
  // on "/". Every locale-less URL, /contact included, answered 404.
  matcher: [
    "/((?!_next|api|fonts|.*\\..*|robots\\.txt|sitemap\\.xml|icon\\.svg|opengraph-image).*)",
  ],
};
