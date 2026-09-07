import { NotFoundBody } from "@/components/sections/NotFoundBody";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * The locale-level boundary. In practice the root `app/not-found.tsx` answers
 * almost everything, because a path that matches no route never reaches this
 * subtree; this stays so that a `notFound()` thrown by a page that did match
 * renders the same page rather than the framework default. It cannot read the
 * route params, so it speaks the default language.
 */
export default function NotFound() {
  return <NotFoundBody locale={DEFAULT_LOCALE} />;
}
