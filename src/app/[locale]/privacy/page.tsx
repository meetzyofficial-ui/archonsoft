import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band, SectionRule } from "@/components/ui/primitives";
import { PRIVACY } from "@/data/privacy";
import { dict } from "@/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.privacy.title,
    description: copy.meta.privacy.description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { en: "/en/privacy", tr: "/tr/privacy" },
    },
    openGraph: {
      title: `${copy.meta.privacy.title} — ${SITE.name}`,
      description: copy.meta.privacy.description,
      url: `/${locale}/privacy`,
      images: [`/${locale}/opengraph-image`],
    },
  };
}

/**
 * Privacy.
 *
 * What is collected on this site and in the world, why, where it goes and
 * for how long, and what the reader can ask — written plainly, in the
 * site's own voice, as sections a person can actually read. The consent
 * line under the world's brief form points here.
 */
export default async function PrivacyPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const page = PRIVACY[locale];

  return (
    <>
      <PageHeader title={copy.nav.privacy} aside={page.updated} lead={page.lead} accent={page.accent} standfirst={page.standfirst}>
        <p className="mt-6 text-[var(--fg-mute)]">{page.controller}</p>
      </PageHeader>

      <Band scheme="paper" size="regular" className="pt-0">
        <div className="frame">
          <SectionRule label={page.sectionsLabel} aside={page.sectionsAside} />
          <ol className="mt-12 md:mt-16">
            {page.sections.map((section, index) => (
              <li key={section.title} className="hairline-t" id={section.id}>
                <Reveal delay={index * 40} className="grid gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10">
                  <span className="mono-label text-[var(--accent)] md:col-span-1">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="text-quote md:col-span-4">{section.title}</h2>
                  <div className="flex max-w-[60ch] flex-col gap-4 text-[var(--fg-dim)] md:col-span-6 md:col-start-7">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.items ? (
                      <ul className="flex flex-col gap-2 border-l border-[var(--line)] pl-5">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="hairline-t mt-4 pt-8 text-[var(--fg-mute)]">
            {page.contact}{" "}
            <a href={`mailto:${page.email}`} className="text-[var(--fg)] underline decoration-[var(--line-strong)] underline-offset-4">
              {page.email}
            </a>
          </p>
        </div>
      </Band>
    </>
  );
}
