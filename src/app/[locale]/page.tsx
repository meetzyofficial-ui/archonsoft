import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Opening } from "@/components/site/Opening";
import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { ServiceSection } from "@/components/services/ServiceSection";
import { HowWeWork } from "@/components/site/HowWeWork";
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

/** Hero, the work, what can be ordered, how it goes, and the door to the world. */
export default async function HomePage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  return (
    <>
      <Opening locale={locale} copy={copy} />
      <ProjectShowcase locale={locale} copy={copy} />
      <ServiceSection locale={locale} copy={copy} />
      <HowWeWork locale={locale} copy={copy} />
      <WorldEntry locale={locale} copy={copy} />
    </>
  );
}
