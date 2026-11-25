import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { PageHeader } from "@/components/ui/PageHeader";
import { dict } from "@/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.work.title,
    description: copy.meta.work.description,
    alternates: {
      canonical: `/${locale}/projects`,
      languages: { en: "/en/projects", tr: "/tr/projects" },
    },
    openGraph: {
      title: `${copy.meta.work.title} — ${SITE.name}`,
      description: copy.meta.work.description,
      url: `/${locale}/projects`,
      images: [`/${locale}/opengraph-image`],
    },
  };
}

/** Every live project, one panel each. */
export default async function ProjectsPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const c = copy.showcase;

  return (
    <>
      <PageHeader title={copy.nav.work} aside={c.aside} lead={c.indexLead} accent={c.indexAccent} standfirst={c.indexBody} />

      <ProjectShowcase locale={locale} copy={copy} heading={false} id="live" />

    </>
  );
}
