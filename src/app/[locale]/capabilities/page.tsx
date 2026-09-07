import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Capabilities } from "@/components/sections/Capabilities";
import { CapabilityMatrix } from "@/components/sections/CapabilityMatrix";
import { ContactCta } from "@/components/sections/ContactCta";
import { TechBand } from "@/components/sections/Approach";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band, ChapterHead } from "@/components/ui/primitives";
import { CAPABILITIES } from "@/data/capabilities";
import { MATRIX } from "@/data/matrix";
import { dict } from "@/i18n/dictionary";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.capabilities.title,
    description: copy.meta.capabilities.description,
    alternates: {
      canonical: `/${locale}/capabilities`,
      languages: { en: "/en/capabilities", tr: "/tr/capabilities" },
    },
    openGraph: {
      title: `${copy.meta.capabilities.title} — ${SITE.name}`,
      description: copy.meta.capabilities.description,
      url: `/${locale}/capabilities`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function CapabilitiesPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${copy.meta.capabilities.title} — ${SITE.name}`,
    url: `${SITE.url}/${locale}/capabilities`,
    itemListElement: CAPABILITIES.map((capability, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: t(capability.title, locale),
      description: t(capability.precis, locale),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageHeader
        title={copy.capabilities.label}
        aside={copy.capabilities.aside}
        lead={copy.capabilities.statement}
        accent={copy.capabilities.statementAccent}
        standfirst={copy.capabilities.body}
      />

      <Capabilities locale={locale} copy={copy} index="01" withLink={false} />

      {/* The matrix. Every claim above ends here, at something that can be
          opened — and a concept is never allowed to sit unlabelled beside a
          shipped product. */}
      <Band scheme="dark" size="regular" id="matrix">
        <div className="frame">
          <ChapterHead
            index={copy.matrix.index}
            title={copy.matrix.label}
            aside={`${MATRIX.length} — ${copy.matrix.aside}`}
          />

          <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
            <h2 className="text-d1 md:col-span-7">
              <SplitReveal text={copy.matrix.statement} lineHeight="0.94em" stagger={34} />
              <SplitReveal
                text={[{ text: copy.matrix.statementAccent }]}
                lineHeight="0.94em"
                stagger={34}
                delay={120}
              />
            </h2>
            <Reveal className="md:col-span-4 md:col-start-9">
              <p className="text-lead text-[var(--fg-dim)]">{copy.matrix.body}</p>
            </Reveal>
          </div>

          <div className="mt-12 md:mt-16">
            <CapabilityMatrix locale={locale} copy={copy} />
          </div>
        </div>
      </Band>

      <TechBand locale={locale} copy={copy} />

      <ContactCta locale={locale} copy={copy} index="—" />
    </>
  );
}
