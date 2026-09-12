import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactCta } from "@/components/sections/ContactCta";
import { PageHeader } from "@/components/ui/PageHeader";
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
      canonical: `/${locale}/work`,
      languages: { en: "/en/work", tr: "/tr/work" },
    },
    openGraph: {
      title: `${copy.meta.work.title} — ${SITE.name}`,
      description: copy.meta.work.description,
      url: `/${locale}/work`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

/**
 * The work index.
 *
 * Everything Archon has built, in one place, filterable by what it is and by
 * whether it went live — which is the question anybody assessing a studio is
 * actually asking. Two products shipped and ten concepts did not, and the
 * index prints that on every row rather than sorting it into two pages the
 * visitor has to find separately.
 *
 * The rows are rendered here, on the server, with their real images and their
 * localised copy. Only the narrowing is client work.
 */
export default async function WorkPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  const items = COLLECTION.map((piece) => ({
    slug: piece.slug,
    provenance: piece.provenance,
    domains: piece.domains,
  }));

  return (
    <>
      <PageHeader
        title={copy.work.indexLabel}
        aside={copy.work.indexAside}
        lead={copy.work.indexStatement}
        accent={copy.work.indexAccent}
        standfirst={copy.work.indexBody}
      />

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
        {COLLECTION.map((piece, index) => (
          <WorkRow
            key={piece.slug}
            piece={piece}
            locale={locale}
            copy={copy}
            priority={index === 0}
          />
        ))}
      </WorkIndex>

      <ContactCta locale={locale} copy={copy} />
    </>
  );
}
