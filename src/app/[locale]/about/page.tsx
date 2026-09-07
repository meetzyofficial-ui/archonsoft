import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { ContactCta } from "@/components/sections/ContactCta";
import { Process } from "@/components/sections/Process";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band, ChapterHead } from "@/components/ui/primitives";
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
    lead: "One person, the whole",
    accent: "span.",
    standfirst:
      "Archon Soft is one person in Ankara who has spent about two years designing, building and shipping complete software products. Not a design studio that hands over screens, and not a dev shop that hands over a repository — the whole thing.",
    note: "Being one person is the constraint and the argument. It is why scope has to be honest, and why nothing gets lost in a handover.",
    spanTitle: "What that actually covers",
    spanBody:
      "Deciding what the product is. Drawing it. Building the client. Building the server. Modelling the data. Accounts and permissions. The admin the business will live in. Getting it live and keeping it there. Two products on this site went through every one of those steps with the same pair of hands.",
    principles: "Principles",
    principlesAside: "How the work runs",
    process: "Process",
    processAside: "Four phases",
    facts: "Facts",
    factsAside: "Verified",
  },
  tr: {
    lead: "Tek kişi, işin",
    accent: "tamamı.",
    standfirst:
      "Archon Soft, Ankara'da yaklaşık iki yıldır yazılım ürünlerini uçtan uca tasarlayan, geliştiren ve yayına alan tek kişi. Ekran teslim eden bir tasarım stüdyosu değil, repo teslim eden bir yazılım şirketi de değil — işin tamamı.",
    note: "Tek kişi olmak hem kısıt hem argüman. Kapsamın dürüst olmak zorunda olmasının ve devir teslimde hiçbir şeyin kaybolmamasının sebebi bu.",
    spanTitle: "Bu aslında neyi kapsıyor",
    spanBody:
      "Ürünün ne olduğuna karar vermek. Çizmek. İstemciyi kurmak. Sunucuyu kurmak. Veriyi modellemek. Hesaplar ve izinler. İşletmenin içinde yaşayacağı yönetim paneli. Yayına almak ve orada tutmak. Bu sitedeki iki ürün de bu adımların hepsinden aynı ellerle geçti.",
    principles: "İlkeler",
    principlesAside: "İş nasıl yürüyor",
    process: "Süreç",
    processAside: "Dört aşama",
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

      <Band scheme="dark" size="regular" className="pt-0">
        <div className="frame">
          <ChapterHead index="—" title={page.facts} aside={page.factsAside} />
          <dl className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {STUDIO_FACTS.map((fact, i) => (
              <div key={fact.label.en} className="scheme-surface">
                <Reveal delay={i * 70} className="p-7 md:p-8">
                  <dt className="mono-label text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
                  <dd className="mt-3 text-d3">{t(fact.value, locale)}</dd>
                </Reveal>
              </div>
            ))}
          </dl>

          <ScrollLit
            as="h2"
            className="mt-20 max-w-[24ch] text-d2 md:mt-28"
            text={page.spanTitle}
          />
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            <Reveal className="md:col-span-6 md:col-start-7">
              <p className="text-lead text-[var(--fg-dim)]">{page.spanBody}</p>
            </Reveal>
          </div>
        </div>
      </Band>

      <Band scheme="dark" size="regular" className="pt-0">
        <div className="frame">
          <ChapterHead index="01" title={page.principles} aside={page.principlesAside} />
          <ol className="mt-12 md:mt-16">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.index} className="hairline-t">
                <Reveal
                  delay={index * 50}
                  className="grid gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10"
                >
                  <span className="mono-label text-[var(--accent)] md:col-span-1">
                    {principle.index}
                  </span>
                  <h3 className="text-d3 md:col-span-4">{t(principle.title, locale)}</h3>
                  <p className="max-w-[54ch] text-[var(--fg-dim)] md:col-span-6 md:col-start-7">
                    {t(principle.body, locale)}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Band>

      <Process locale={locale} index="02" title={page.process} aside={page.processAside} />
      <ContactCta locale={locale} copy={copy} index="03" />
    </>
  );
}
