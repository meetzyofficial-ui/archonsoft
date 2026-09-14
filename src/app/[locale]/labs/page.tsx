import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Experiments } from "@/components/lab/Experiments";
import { Icon } from "@/components/labs/Icon";
import { LabsExplorer } from "@/components/labs/LabsExplorer";
import { Reveal } from "@/components/motion/Reveal";
import { ContactCta } from "@/components/sections/ContactCta";
import { LabNotes } from "@/components/sections/LabNotes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Provenance } from "@/components/ui/Provenance";
import { Band, SectionRule } from "@/components/ui/primitives";
import { LABS, getDomain } from "@/data/labs";
import { EXPERIMENTS, LAB_NOTES } from "@/data/lab";
import { dict } from "@/i18n/dictionary";
import { isLocale, localePath, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { conceptTitle } from "@/data/labs/titles";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.labs.title,
    description: copy.meta.labs.description,
    alternates: {
      canonical: `/${locale}/labs`,
      languages: { en: "/en/labs", tr: "/tr/labs" },
    },
    openGraph: {
      title: `${copy.meta.labs.title} — ${SITE.name}`,
      description: copy.meta.labs.description,
      url: `/${locale}/labs`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function LabsPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  /* Marked up as a CreativeWork collection rather than a portfolio of
     projects, because that is what it is: work made to demonstrate, not work
     delivered to a client. */
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${copy.meta.labs.title} — ${SITE.name}`,
    url: `${SITE.url}/${locale}/labs`,
    itemListElement: LABS.map((lab, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: conceptTitle(lab.slug, locale, lab.name),
      description: t(lab.statement, locale),
      url: `${SITE.url}/${locale}/labs/${lab.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <PageHeader
        title={copy.labs.label}
        aside={`${LABS.length} — ${copy.labs.count}`}
        lead={copy.labs.statement}
        accent={copy.labs.statementAccent}
        standfirst={copy.labs.body}
      >
        <p className="mt-6 flex flex-wrap items-center gap-3">
          <Provenance kind="concept" copy={copy} />
          <span className="mono-label text-[var(--fg-mute)]">{copy.provenance.conceptNote}</span>
        </p>
      </PageHeader>

      <Band scheme="paper" size="tight" className="pt-2">
        <div className="frame">
          <LabsExplorer locale={locale} copy={copy} />
        </div>
      </Band>

      {/* The whole set, as a plate. */}
      <Band scheme="haze" size="regular">
        <div className="frame">
          <SectionRule label={copy.labs.all} aside={copy.provenance.concept} />
        </div>

        <Reveal variant="none" className="mt-10 md:mt-14">
          <ul className="universe-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {LABS.map((lab, index) => (
              <li key={lab.slug}>
                <Link
                  href={localePath(locale, `/labs/${lab.slug}`)}
                  style={{
                    transitionDelay: `${index * 45}ms`,
                  }}
                  className="reveal-fade group/card flex h-full flex-col py-6 pr-6 transition-colors duration-500 hover:bg-[color-mix(in_oklab,var(--color-cyan)_6%,transparent)] md:py-7"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="mono-label text-[var(--fg-mute)]">{lab.index}</span>
                    <span
                      aria-hidden="true"
                      className="size-1.5 translate-y-[-0.15em] rounded-full bg-[var(--accent)]"
                    />
                    <Icon
                      name={lab.icon}
                      size={15}
                      className="ml-auto shrink-0 text-[var(--fg-mute)] transition-colors duration-500 group-hover/card:text-[var(--accent)]"
                    />
                  </div>
                  <h3 className="display mt-4 text-quote">{conceptTitle(lab.slug, locale, lab.name)}</h3>
                  <p className="mono-label mt-2 text-[var(--fg-mute)]">{t(lab.sector, locale)}</p>
                  <p className="mt-4 text-lead text-[var(--fg)]">{t(lab.story.promise, locale)}</p>
                  <p className="mt-3 text-[var(--fg-dim)]">{t(lab.story.problem, locale)}</p>
                  <div className="mt-auto pt-6">
                    <p className="mono-label text-[var(--fg-mute)]">{copy.story.capability}</p>
                    <p className="mt-1.5 text-[var(--fg)]">{t(lab.story.capability, locale)}</p>
                    <p className="mono-label mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[var(--fg-mute)]">
                      {lab.domains.map((id) => {
                        const domain = getDomain(id);
                        return domain ? <span key={id}>{t(domain.title, locale)}</span> : null;
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Band>

      {/* The experiments are a different thing entirely and are kept apart:
          they are not products and they make no argument. */}
      <Band scheme="paper" size="regular">
        <div className="frame">
          <SectionRule label={copy.labs.experiments} aside={`${EXPERIMENTS.length} / ${copy.next.running}`} />
          <p className="mt-8 max-w-[62ch] text-lead text-[var(--fg-dim)]">
            {copy.labs.experimentsBody}
          </p>
          <Experiments locale={locale} />
        </div>
      </Band>

      <Band scheme="paper" size="regular" className="pt-0">
        <div className="frame">
          <SectionRule label={copy.next.threads} aside={String(LAB_NOTES.length)} />
          <LabNotes notes={LAB_NOTES} locale={locale} copy={copy} className="mt-12 md:mt-16" />
        </div>
      </Band>

      <ContactCta locale={locale} copy={copy} />
    </>
  );
}
