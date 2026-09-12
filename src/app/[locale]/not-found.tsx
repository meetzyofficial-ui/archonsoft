import { headers } from "next/headers";

import { NotFoundBody } from "@/components/sections/NotFoundBody";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import { LOCALE_HEADER } from "@/middleware";

/**
 * The locale-level boundary, answering in the visitor's own language.
 *
 * A `not-found` boundary is the one server component in the App Router that
 * cannot read its own route params, so this used to render in English no
 * matter which prefix was asked for — every Turkish visitor who mistyped a URL
 * got an English page. The middleware stamps the language onto the request
 * instead, and this reads it back.
 *
 * Reading a header opts the route into dynamic rendering, which is exactly
 * right for a page that only ever answers a request nobody planned for.
 */
export default async function NotFound() {
  const requested = (await headers()).get(LOCALE_HEADER) ?? "";
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  return <NotFoundBody locale={locale} />;
}
