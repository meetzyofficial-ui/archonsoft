import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Opening } from "@/components/site/Opening";
import { StudioStatement } from "@/components/site/StudioStatement";
import { SelectedWork } from "@/components/site/SelectedWork";
import { LabsBand } from "@/components/sections/LabsBand";
import { Capabilities } from "@/components/site/Capabilities";
import { DesignEngineering } from "@/components/site/DesignEngineering";
import { WorldEntry } from "@/components/site/WorldEntry";
import { dict } from "@/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";

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
 * The home page, as one continuous field in seven movements.
 *
 * It opens in daylight and closes at night, and everything between is the same
 * air: the sections paint no background of their own, so the atmosphere and
 * the form behind the document run under all of them and the page reads as one
 * place rather than a stack of bands.
 *
 * The order is an argument. What is made here, why it is one studio, the three
 * products that actually shipped, the ten concepts built so the rest can be
 * shown rather than claimed, the disciplines with their evidence attached, the
 * single claim this studio makes about itself, and then the door out of the
 * website into the world. Proof precedes every capability claim, and the
 * concepts arrive only after the real work, so their labelling has somewhere
 * honest to sit.
 *
 * Contact is not a section here. It is the last thing the close says, which is
 * where it belongs on a page that has just spent eight screens showing work.
 */
export default async function HomePage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  return (
    <>
      <Opening locale={locale} copy={copy} />
      <StudioStatement locale={locale} copy={copy} />
      <SelectedWork locale={locale} copy={copy} />
      <LabsBand locale={locale} copy={copy} />
      <Capabilities locale={locale} copy={copy} />
      <DesignEngineering copy={copy} />
      <WorldEntry locale={locale} copy={copy} />
    </>
  );
}
