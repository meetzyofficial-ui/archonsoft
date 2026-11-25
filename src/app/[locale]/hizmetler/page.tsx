import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { SERVICE_PAGES } from "@/data/servicePages";
import { dict } from "@/i18n/dictionary";
import { isLocale, localePath, type Locale } from "@/lib/i18n";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = dict(locale).servicePage;
  return {
    title: c.indexTitle,
    description: c.indexDescription,
    alternates: { canonical: `/${locale}/hizmetler`, languages: { en: "/en/hizmetler", tr: "/tr/hizmetler" } },
    openGraph: { title: c.indexTitle, description: c.indexDescription, url: `/${locale}/hizmetler`, images: [`/${locale}/opengraph-image`] },
  };
}

export default async function ServicesPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const c = dict(locale).servicePage;
  return (
    <>
      <PageHeader title={c.indexTitle} lead={c.indexLead} accent={c.indexAccent} standfirst={c.indexBody} />
      <section className="py-10 md:py-16" data-track-section="hizmet-listesi">
        <ul className="frame border-t-2 border-[var(--fg)]">
          {SERVICE_PAGES.map((page) => (
            <li key={page.slug} className="border-b border-[var(--line-strong)]">
              <Link href={localePath(locale, `/hizmetler/${page.slug}`)} className="group grid gap-2 py-6 transition-colors hover:bg-[var(--color-orange)] md:grid-cols-12 md:items-baseline md:gap-8 md:px-4">
                <h2 className="text-head md:col-span-4">{page[locale].name}</h2>
                <p className="max-w-[60ch] text-[var(--fg-dim)] group-hover:text-[var(--color-black)] md:col-span-6">{page[locale].intro}</p>
                <span className="font-bold md:col-span-2 md:text-right">{page.slug === "web-sitesi" ? c.from : "→"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
