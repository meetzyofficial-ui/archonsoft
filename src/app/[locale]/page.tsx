import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Opening } from "@/components/site/Opening";
import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { LabsBand } from "@/components/sections/LabsBand";
import { ServiceSection } from "@/components/services/ServiceSection";
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
 * The home page, in six movements, each with one job.
 *
 * What the studio does (the opening), what a visitor can have built — shown,
 * not listed, and ending in the contact form (the service explorer), the proof
 * (selected projects, staged), how it works (design × engineering), what else
 * it can build (Archon Labs, ten running concepts), and the door out of the
 * website into the world. Contact is the close, in the footer every page ends
 * on.
 *
 * Two chapters were removed in the creative-tech rebuild because they said
 * the same thing twice: the studio statement and the old selected-work list,
 * whose claim now lives in the projects themselves.
 */
export default async function HomePage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  return (
    <>
      <Opening locale={locale} copy={copy} />
      <ServiceSection locale={locale} copy={copy} />
      <ProjectShowcase locale={locale} copy={copy} />
      <DesignEngineering copy={copy} />
      <LabsBand locale={locale} copy={copy} />
      <WorldEntry locale={locale} copy={copy} />
    </>
  );
}
