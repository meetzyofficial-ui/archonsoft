import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Hero } from "@/components/sections/Hero";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { LabsBand } from "@/components/sections/LabsBand";
import {
  CategoryBand,
  ProcessBand,
  SelectBand,
  SystemBand,
} from "@/components/sections/Approach";
import { ContactCta } from "@/components/sections/ContactCta";
import { PROJECTS } from "@/data/projects";
import { dict } from "@/i18n/dictionary";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { optimizedSrc } from "@/lib/imageSrc";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.home.title,
    description: copy.meta.description,
    alternates: { canonical: `/${locale}` },
  };
}

/**
 * The home page, as one argument in eight moves.
 *
 * Position and proof at once (01–02): the claim, then the two products that
 * actually shipped. Then why one studio rather than three (03), the thirteen
 * kinds of software a visitor might be asking for (04), the ten concepts built
 * to show the rest (05), a chooser that resolves their own situation (06), how
 * the work runs (07), and the way in (08).
 *
 * The rhythm alternates deliberately: real product, then system, then
 * capability, then concept. Proof comes before every capability claim, and
 * the concepts arrive only after the real work has been shown, so their
 * labelling has somewhere honest to sit. Every claim on the page ends at a
 * visual object rather than a paragraph.
 */
export default async function HomePage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  // The hero assembles Meetzy's mood screen. It is sliced into bands painted
  // from one decoded bitmap, so the URL has to be resolved on the server.
  const lead = PROJECTS[0]!.lead;
  const heroScreen = {
    src: optimizedSrc(lead.image, 640),
    width: lead.image.width,
    height: lead.image.height,
    alt: t(lead.caption, locale),
  };

  return (
    <>
      {/* The hero screen is painted through `background-image`, which the
          preload scanner cannot see. Without this it is requested after
          layout and becomes the last paint on the page. */}
      <link
        rel="preload"
        as="image"
        href={heroScreen.src}
        fetchPriority="high"
      />
      <Hero locale={locale} copy={copy} screen={heroScreen} />
      <SelectedWork locale={locale} copy={copy} />
      <SystemBand locale={locale} copy={copy} />
      <CategoryBand locale={locale} copy={copy} />
      <LabsBand locale={locale} copy={copy} />
      <SelectBand locale={locale} copy={copy} />
      <ProcessBand locale={locale} copy={copy} />
      <ContactCta locale={locale} copy={copy} />
    </>
  );
}
