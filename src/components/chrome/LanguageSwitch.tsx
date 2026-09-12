"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, LOCALE_NAME, stripLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Two real links, not a dropdown.
 *
 * Every route exists under both prefixes, so switching language is a link to
 * the same page in the other language — which means it works without
 * JavaScript, it is crawlable, and it never dumps you back on the home page
 * the way a client-side locale toggle usually does.
 */
export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const rest = stripLocale(pathname);

  return (
    /* Two words and a slash. It was a bordered segmented control, which was
       the only pill left in the header and read as a widget rather than as
       part of the masthead. */
    <div className="mono-label flex items-center" role="group" aria-label={label}>
      {LOCALES.map((code, i) => {
        const active = code === locale;
        return (
          <span key={code} className="flex items-center">
            {i > 0 ? (
              <span aria-hidden="true" className="px-1.5 text-[var(--fg-mute)]">
                /
              </span>
            ) : null}
          <Link
            href={`/${code}${rest}`}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            aria-label={LOCALE_NAME[code]}
            className={cn(
              /* Two letters at eleven pixels is a sixteen-pixel pointer
                 target — under what WCAG 2.2 asks of a control. The box grows
                 and the negative margin hands the space straight back, so the
                 masthead is unchanged and the finger gets twenty-eight. */
              "link-rule -mx-1.5 px-1.5 [--rule-inset:0.375rem] transition-colors duration-300",
              active ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
            )}
          >
            {LOCALE_LABEL[code]}
          </Link>
          </span>
        );
      })}
    </div>
  );
}
