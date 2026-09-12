import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactForm } from "@/components/sections/ContactForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band } from "@/components/ui/primitives";
import { dict } from "@/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.contact.title,
    description: copy.meta.contact.description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { en: "/en/contact", tr: "/tr/contact" },
    },
    openGraph: {
      title: `${copy.meta.contact.title} — ${SITE.name}`,
      description: copy.meta.contact.description,
      url: `/${locale}/contact`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function ContactPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  return (
    <>
      <PageHeader
        title={copy.contact.label}
        aside={copy.contact.aside}
        lead={copy.contact.statement}
        accent={copy.contact.statementAccent}
        standfirst={copy.contact.body}
      />

      <Band scheme="paper" size="tight" className="pt-0">
        <div className="frame grid gap-14 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <ContactForm locale={locale} copy={copy} />
          </div>

          <aside className="md:col-span-4 md:col-start-9">
            <div className="hairline-t pt-10">
              <h2 className="mono-label text-[var(--fg-mute)]">{copy.contact.direct}</h2>
              {CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="link-rule mt-4 inline-block text-lead">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <p className="mt-4 max-w-[34ch] text-[var(--fg-dim)]">{copy.contact.noEmail}</p>
              )}
              <p className="mono-label mt-6 text-[var(--fg-mute)]">{copy.hero.location}</p>
            </div>

            <div className="hairline-t mt-12 pt-10">
              <h2 className="mono-label text-[var(--fg-mute)]">{copy.contact.notFor.title}</h2>
              <ul className="mt-5 space-y-4">
                {copy.contact.notFor.items.map((item) => (
                  <li key={item} className="text-[var(--fg-dim)]">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[var(--fg-mute)]">{copy.contact.notFor.note}</p>
            </div>
          </aside>
        </div>
      </Band>
    </>
  );
}
