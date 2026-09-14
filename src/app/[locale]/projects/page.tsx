import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { ContactCta } from "@/components/sections/ContactCta";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionRule } from "@/components/ui/primitives";
import { WorkIndex } from "@/components/work/WorkIndex";
import { WorkRow } from "@/components/work/WorkRow";
import { COLLECTION, DOMAIN_FACETS, PROVENANCE_FACETS } from "@/data/collection";
import { dict } from "@/i18n/dictionary";
import { isLocale, t, type Locale } from "@/lib/i18n";
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

/**
 * Projects.
 *
 * Two levels, on one page. First the live work, staged the way the home page
 * stages it — each project a spread you can walk into. Then the whole
 * archive, filterable by what a piece is and by whether it went live, with the
 * concept products labelled on every row as what they are.
 *
 * The rows are rendered on the server with their real images and localised
 * copy; only the narrowing is client work.
 */
export default async function ProjectsPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const c = copy.showcase;

  const items = COLLECTION.map((piece) => ({
    slug: piece.slug,
    provenance: piece.provenance,
    domains: piece.domains,
  }));

  return (
    <>
      <PageHeader title={copy.nav.work} aside={c.aside} lead={c.indexLead} accent={c.indexAccent} standfirst={c.indexBody} />

      <ProjectShowcase locale={locale} copy={copy} heading={false} id="live" />

      <section id="archive" data-band="paper" className="pt-16 md:pt-24">
        <div className="frame">
          <SectionRule label={c.archiveLabel} aside={c.archiveAside} />
        </div>
      </section>

      <WorkIndex
        items={items}
        provenanceFacets={PROVENANCE_FACETS.map((facet) => ({
          id: facet.id,
          label: t(facet.label, locale),
          count: facet.count,
        }))}
        domainFacets={DOMAIN_FACETS.map((facet) => ({
          id: facet.id,
          label: t(facet.label, locale),
          count: facet.count,
        }))}
        copy={{
          all: copy.work.all,
          provenance: copy.work.filterProvenance,
          domain: copy.work.filterDomain,
          showing: copy.work.showing,
          ofTotal: copy.work.ofTotal,
          pieces: copy.work.pieces,
          empty: copy.work.empty,
          reset: copy.work.reset,
        }}
      >
        {COLLECTION.map((piece) => (
          <WorkRow key={piece.slug} piece={piece} locale={locale} copy={copy} />
        ))}
      </WorkIndex>

      <ContactCta locale={locale} copy={copy} />
    </>
  );
}
