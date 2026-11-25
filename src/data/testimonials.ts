import type { Locale } from "@/lib/i18n";

/**
 * What clients said, in their own words and with their permission. Empty until
 * there is a real one; the section does not render without it.
 *
 *   { name: "Ad Soyad", role: "Müdür, X Ortaokulu", text: { tr: "…", en: "…" } }
 */
export const TESTIMONIALS: { name: string; role: string; text: Record<Locale, string> }[] = [];
