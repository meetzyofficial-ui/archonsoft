import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n";

/**
 * Every page lives under a locale prefix, so anything arriving without one is
 * sent to a language chosen from the request (below). Doing it here rather
 * than with a redirect page means a mistyped URL still lands on the localised
 * 404 with the full chrome, instead of on a bare framework error page.
 *
 * It also stamps the language onto the request. A `not-found` boundary is the
 * one server component in the App Router that cannot read its own route
 * params, so without this every Turkish visitor who mistyped a URL was
 * answered in English — on a site whose whole point is that both languages are
 * real.
 */
export const LOCALE_HEADER = "x-archon-locale";

/**
 * Which language a locale-less URL is sent to.
 *
 * The domain is Turkish and so is most of the audience, and the link people
 * paste into WhatsApp is the bare domain. Link-preview crawlers (WhatsApp,
 * Facebook, LinkedIn) send no Accept-Language at all, so without one the
 * answer is Turkish — that is what makes the shared card Turkish. A browser
 * that does state a preference gets the supported language it ranks highest,
 * and one that asks only for languages this site does not have gets English.
 */
function negotiate(header: string | null): Locale {
  if (!header?.trim()) return "tr";
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...rest] = part.trim().split(";");
      const q = rest.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0] ?? "", q: q ? Number(q.slice(2)) || 0 : 1, index };
    })
    .filter((one) => one.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  const found = ranked.find((one) => isLocale(one.base));
  return found && isLocale(found.base) ? found.base : "en";
}

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
  url.pathname = `/${negotiate(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  /* The redirect depends on the header; no cache may hand one visitor's to another. */
  response.headers.set("Vary", "Accept-Language");
  return response;
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
