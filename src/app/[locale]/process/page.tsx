import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProcessBand } from "@/components/sections/Approach";
import { ContactCta } from "@/components/sections/ContactCta";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band } from "@/components/ui/primitives";
import { PROCESS } from "@/data/process";
import { dict } from "@/i18n/dictionary";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.process.title,
    description: copy.meta.process.description,
    alternates: {
      canonical: `/${locale}/process`,
      languages: { en: "/en/process", tr: "/tr/process" },
    },
    openGraph: {
      title: `${copy.meta.process.title} — ${SITE.name}`,
      description: copy.meta.process.description,
      url: `/${locale}/process`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function ProcessPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${copy.meta.process.title} — ${SITE.name}`,
    description: copy.meta.process.description,
    step: PROCESS.map((stage, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: t(stage.title, locale),
      text: t(stage.precis, locale),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <PageHeader
        title={copy.process.label}
        aside={`${PROCESS.length} — ${copy.process.aside}`}
        lead={copy.process.statement}
        accent={copy.process.statementAccent}
        standfirst={copy.process.body}
      />

      <Band scheme="dark" size="regular" className="pt-4">
        <ProcessBand locale={locale} copy={copy} detailed withHead={false} />
      </Band>

      <ContactCta locale={locale} copy={copy} index="—" />
    </>
  );
}
