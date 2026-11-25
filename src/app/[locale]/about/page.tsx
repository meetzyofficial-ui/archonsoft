import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band, SectionRule } from "@/components/ui/primitives";
import { PRINCIPLES, STUDIO_FACTS } from "@/data/practice";
import { dict } from "@/i18n/dictionary";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.about.title,
    description: copy.meta.about.description,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { en: "/en/about", tr: "/tr/about" },
    },
    openGraph: {
      title: `${copy.meta.about.title} — ${SITE.name}`,
      description: copy.meta.about.description,
      url: `/${locale}/about`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

const ABOUT = {
  en: {
    lead: "One studio, the whole",
    accent: "span.",
    standfirst:
      "Archon Soft is a software studio in Ankara. For about two years we have designed, built and shipped complete products: the screens, the code and everything behind them.",
    note: "Design and engineering sit at the same table here, so nothing gets lost in a handover.",
    spanTitle: "What that actually covers",
    spanBody:
      "Deciding what the product is. Drawing it. Building the client. Building the server. Modelling the data. Accounts and permissions. The admin the business will live in. Getting it live and keeping it there. Every product on this site went through every one of those steps in the same studio.",
    principles: "Principles",
    principlesAside: "How the work runs",
    facts: "Facts",
    factsAside: "Verified",
  },
  tr: {
    lead: "Tek stüdyo, işin",
    accent: "tamamı.",
    standfirst:
      "Archon Soft, Ankara'da bir yazılım stüdyosu. Yaklaşık iki yıldır ürünleri uçtan uca tasarlıyor, geliştiriyor ve yayına alıyoruz: ekranı da, kodu da, arkasındaki her şeyi de.",
    note: "Tasarım ve mühendislik burada aynı masada; devir teslimde hiçbir şey kaybolmuyor.",
    spanTitle: "Bu aslında neyi kapsıyor",
    spanBody:
      "Ürünün ne olduğuna karar vermek. Çizmek. İstemciyi kurmak. Sunucuyu kurmak. Veriyi modellemek. Hesaplar ve izinler. İşletmenin içinde yaşayacağı yönetim paneli. Yayına almak ve orada tutmak. Bu sitedeki ürünlerin hepsi bu adımların hepsinden aynı stüdyoda geçti.",
    principles: "İlkeler",
    principlesAside: "İş nasıl yürüyor",
    facts: "Bilgiler",
    factsAside: "Doğrulanmış",
  },
} as const;

export default async function AboutPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const page = ABOUT[locale];

  return (
    <>
      <PageHeader
        title={copy.nav.about}
        aside={copy.hero.location}
        lead={page.lead}
        accent={page.accent}
        standfirst={page.standfirst}
      >
        <p className="mt-6 text-[var(--fg-mute)]">{page.note}</p>
      </PageHeader>

      <Band scheme="paper" size="regular" className="pt-0">
        <div className="frame">
          <SectionRule label={page.facts} aside={page.factsAside} />
          <dl className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {STUDIO_FACTS.map((fact, i) => (
              <div key={fact.label.en} className="scheme-surface">
                <Reveal delay={i * 70} className="p-7 md:p-8">
                  <dt className="mono-label text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
                  <dd className="mt-3 text-quote">{t(fact.value, locale)}</dd>
                </Reveal>
              </div>
            ))}
          </dl>

          <ScrollLit
            as="h2"
            className="mt-20 max-w-[24ch] text-sub md:mt-28"
            text={page.spanTitle}
          />
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            <Reveal className="md:col-span-6 md:col-start-7">
              <p className="text-lead text-[var(--fg-dim)]">{page.spanBody}</p>
            </Reveal>
          </div>
        </div>
      </Band>

      <Band scheme="paper" size="regular" className="pt-0">
        <div className="frame">
          <SectionRule label={page.principles} aside={page.principlesAside} />
          <ol className="mt-12 md:mt-16">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.index} className="hairline-t">
                <Reveal
                  delay={index * 50}
                  className="grid gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10"
                >
                  <h3 className="text-quote md:col-span-4">{t(principle.title, locale)}</h3>
                  <p className="max-w-[54ch] text-[var(--fg-dim)] md:col-span-6 md:col-start-7">
                    {t(principle.body, locale)}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Band>

    </>
  );
}
