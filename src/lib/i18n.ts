/**
 * Two languages, one tree.
 *
 * Every route lives under `/[locale]`, so a page never has to guess which
 * language it is in and the switcher is a plain link to the same path under
 * the other prefix. Copy that belongs to content (projects, capabilities) is
 * carried on the data as `Localized` pairs rather than kept in a parallel
 * dictionary, which is what stops the two languages drifting apart.
 */

export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** A string that exists in both languages. Neither side is optional. */
export type Localized = { en: string; tr: string };
export type LocalizedList = { en: string[]; tr: string[] };

export const t = (value: Localized, locale: Locale): string => value[locale];
export const tl = (value: LocalizedList, locale: Locale): string[] => value[locale];

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** BCP-47 tags, for `lang`, `hreflang` and Open Graph. */
export const HTML_LANG: Record<Locale, string> = { en: "en", tr: "tr" };
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", tr: "tr_TR" };

export const LOCALE_LABEL: Record<Locale, string> = { en: "EN", tr: "TR" };
export const LOCALE_NAME: Record<Locale, string> = { en: "English", tr: "Türkçe" };

/** Prefixes a path with the locale. `path` always starts with a slash or is "". */
export const localePath = (locale: Locale, path = ""): string =>
  `/${locale}${path === "/" ? "" : path}`;

/** Strips the locale prefix from a pathname, for the language switcher. */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|tr)(\/.*)?$/);
  return match?.[2] ?? "";
}
