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
    <div
      className="mono-label flex items-center gap-1 border border-[var(--line)] px-1"
      role="group"
      aria-label={label}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <Link
            key={code}
            href={`/${code}${rest}`}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            aria-label={LOCALE_NAME[code]}
            className={cn(
              "px-2 py-2 transition-colors duration-300",
              active ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
            )}
          >
            {LOCALE_LABEL[code]}
          </Link>
        );
      })}
    </div>
  );
}
