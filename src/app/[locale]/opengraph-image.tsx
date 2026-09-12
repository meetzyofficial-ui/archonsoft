import { dict } from "@/i18n/dictionary";
import { isLocale, LOCALES } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Archon Soft";

/* Prerendered for both locales at build time, where the fonts are on disk. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = dict(isLocale(locale) ? locale : "en");

  return renderOgImage({
    eyebrow: copy.hero.studio,
    title: copy.hero.lead,
    accent: copy.hero.leadAccent,
    meta: copy.hero.location,
  });
}
