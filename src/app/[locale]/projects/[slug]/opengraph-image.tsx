import { SHOWCASE, getShowcase } from "@/data/showcase";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Archon Soft project";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SHOWCASE.map((project) => ({ locale, slug: project.slug })));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const copy = dict(locale);
  const project = getShowcase(slug);

  return renderOgImage({
    eyebrow: copy.showcase.caseStudy,
    title: project?.title ?? "Archon Soft",
    meta: project ? t(project.category, locale) : copy.hero.location,
  });
}
