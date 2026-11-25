import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { panelStyle } from "@/data/panels";
import { SERVICE_PAGES, getServicePage } from "@/data/servicePages";
import { getShowcase, projectPath } from "@/data/showcase";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, localePath, t, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, PHONE_E164, SITE, whatsappLink } from "@/lib/site";

type Params = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SERVICE_PAGES.map((page) => ({ locale, slug: page.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getServicePage(slug);
  if (!isLocale(locale) || !page) return {};
  const c = page[locale];
  const path = `/hizmetler/${slug}`;
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/${locale}${path}`, languages: { en: `/en${path}`, tr: `/tr${path}` } },
    openGraph: { title: c.title, description: c.description, url: `/${locale}${path}`, images: [`/${locale}/opengraph-image`] },
  };
}

export default async function ServicePageRoute({ params }: Params) {
  const { locale: raw, slug } = await params;
  const page = getServicePage(slug);
  if (!isLocale(raw) || !page) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const s = copy.servicePage;
  const c = page[locale];
  const projects = page.projects.map((one) => getShowcase(one)!).filter(Boolean);
  const url = `${SITE.url}/${locale}/hizmetler/${slug}`;
  const contact = `${localePath(locale, "/contact")}?service=${page.service}`;
  const wa = whatsappLink(`${s.waText} ${c.name}`);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: c.h1,
      description: c.description,
      url,
      areaServed: "TR",
      provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url, telephone: PHONE_E164, email: CONTACT_EMAIL },
      ...(slug === "web-sitesi"
        ? { offers: { "@type": "Offer", priceCurrency: "TRY", priceSpecification: { "@type": "PriceSpecification", minPrice: 10000, priceCurrency: "TRY" } } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((one) => ({ "@type": "Question", name: one.q, acceptedAnswer: { "@type": "Answer", text: one.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: copy.nav.services, item: `${SITE.url}/${locale}/hizmetler` },
        { "@type": "ListItem", position: 2, name: c.name, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section data-scheme="black" data-track-section="hizmet-baslik" className="forge pt-[var(--header-h)] text-[var(--fg)]">
        <div className="frame py-12 md:py-20">
          <Link href={localePath(locale, "/hizmetler")} className="link-rule mono-label">
            ← {copy.nav.services}
          </Link>
          <h1 className="text-display mt-6 max-w-[16ch]">{c.h1}</h1>
          <p className="mt-6 max-w-[56ch] text-lead text-[var(--fg-dim)]">{c.intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={contact} className="btn-raised">
              {s.quote}
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-raised btn-ghost">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="steel py-10 md:py-14" data-scheme="haze" data-track-section="hizmet-fiyat">
        <div className="frame">
          <p className="text-head max-w-[36ch] text-[var(--color-black)]">{c.priceLine}</p>
        </div>
      </section>

      <section className="py-14 md:py-24" data-track-section="hizmet-kapsam">
        <div className="frame grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-head">{s.includes}</h2>
            <ul className="mt-6 border-t border-[var(--line-strong)]">
              {c.includes.map((one) => (
                <li key={one} className="border-b border-[var(--line)] py-3 text-lead font-semibold">
                  {one}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-head">{s.forWhom}</h2>
            <ul className="mt-6 border-t border-[var(--line-strong)]">
              {c.forWhom.map((one) => (
                <li key={one} className="border-b border-[var(--line)] py-3 text-lead">
                  {one}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {projects.length > 0 ? (
        <section data-scheme="black" className="bg-[var(--color-black)] text-[var(--fg)]" data-track-section="hizmet-isler">
          <div className="frame py-14 md:py-20">
            <h2 className="text-head">{s.work}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const picture = project.hero[0]!;
                return (
                  <li key={project.slug} style={panelStyle(project.slug)}>
                    <Link href={localePath(locale, projectPath(project.slug))} className="group block h-full bg-[var(--panel-bg)] text-[var(--panel-fg)]">
                      <span className="relative block aspect-[16/10] overflow-hidden">
                        <Image src={picture.image} alt={t(picture.alt, locale)} fill placeholder="blur" sizes="(min-width: 1024px) 30vw, 92vw" className="object-cover object-top" />
                      </span>
                      <span className="block p-6">
                        <span className="block text-head">{project.title}</span>
                        <span className="mt-2 block">{t(project.tagline, locale)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="py-14 md:py-24" data-track-section="hizmet-sss">
        <div className="frame grid gap-8 md:grid-cols-12">
          <h2 className="text-head md:col-span-4">{s.faq}</h2>
          <div className="md:col-span-8">
            {c.faq.map((one) => (
              <details key={one.q} className="group border-b border-[var(--line-strong)] first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-sub">
                  {one.q}
                  <span aria-hidden="true" className="text-[1.75rem] leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-[var(--fg-dim)]">{one.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-14 md:pb-24">
        <div className="frame">
          <h2 className="text-head">{s.others}</h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {SERVICE_PAGES.filter((one) => one.slug !== slug).map((one) => (
              <li key={one.slug}>
                <Link href={localePath(locale, `/hizmetler/${one.slug}`)} className="block bg-[var(--bg-deep)] px-4 py-3 font-semibold hover:bg-[var(--color-orange)]">
                  {one[locale].name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
