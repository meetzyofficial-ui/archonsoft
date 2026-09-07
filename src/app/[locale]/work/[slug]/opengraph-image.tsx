import { PROJECTS, getProject } from "@/data/projects";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Archon Soft case study";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => PROJECTS.map((project) => ({ locale, slug: project.slug })));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const copy = dict(locale);
  const project = getProject(slug);

  return renderOgImage({
    eyebrow: copy.work.caseStudy,
    title: project?.name ?? "Archon Soft",
    meta: project ? t(project.category, locale) : copy.hero.location,
  });
}
