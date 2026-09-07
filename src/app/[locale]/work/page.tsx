import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { ProductPlane } from "@/components/product/ProductPlane";
import { ContactCta } from "@/components/sections/ContactCta";
import { PageHeader } from "@/components/ui/PageHeader";
import { Band } from "@/components/ui/primitives";
import { PROJECTS } from "@/data/projects";
import { dict } from "@/i18n/dictionary";
import { isLocale, localePath, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);
  return {
    title: copy.meta.work.title,
    description: copy.meta.work.description,
    alternates: {
      canonical: `/${locale}/work`,
      languages: { en: "/en/work", tr: "/tr/work" },
    },
    openGraph: {
      title: `${copy.meta.work.title} — ${SITE.name}`,
      description: copy.meta.work.description,
      url: `/${locale}/work`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function WorkPage({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  return (
    <>
      <PageHeader
        title={copy.work.label}
        aside={copy.work.aside}
        lead={copy.work.statement}
        accent={copy.work.statementAccent}
        standfirst={copy.work.body}
      />

      <Band scheme="dark" size="tight" className="pt-0">
        <div className="frame space-y-24 md:space-y-36">
          {PROJECTS.map((project, index) => (
            <article
              key={project.slug}
              className="hairline-t pt-8"
              style={{ ["--accent" as string]: project.accent }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                <span className="mono-label text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mono-label text-[var(--fg-mute)]">
                  {t(project.category, locale)}
                </span>
              </div>

              <Link
                href={localePath(locale, `/work/${project.slug}`)}
                data-cursor-label={copy.work.open}
                className="group mt-8 block"
              >
                <h2 className="text-d1 transition-transform duration-[900ms] ease-[var(--ease-out-expo)] md:group-hover:translate-x-2">
                  {project.name}
                </h2>

                <div className="mt-10 grid gap-8 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <p className="max-w-[42ch] text-lead text-[var(--fg-dim)]">
                      {t(project.summary, locale)}
                    </p>
                    <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
                      {project.facts.map((fact) => (
                        <div key={fact.label.en}>
                          <dt className="mono-label text-[var(--fg-mute)]">
                            {t(fact.label, locale)}
                          </dt>
                          <dd className="mt-1">{t(fact.value, locale)}</dd>
                        </div>
                      ))}
                    </dl>
                    <span className="mono-label link-rule mt-8 inline-flex items-center gap-3">
                      {copy.work.read}
                      <span
                        aria-hidden="true"
                        className="block h-px w-8 origin-left bg-current transition-transform duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-x-[2]"
                      />
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 md:col-span-6 md:col-start-7">
                    {project.screens.slice(0, 3).map((screen, i) => (
                      <Reveal key={i} delay={i * 70}>
                        <ProductPlane
                          screen={screen}
                          locale={locale}
                          showCaption={false}
                          sizes="(min-width: 768px) 16vw, 30vw"
                          className="transition-transform duration-[900ms] ease-[var(--ease-out-expo)] md:group-hover:-translate-y-2"
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </Band>

      <ContactCta locale={locale} copy={copy} index="—" />
    </>
  );
}
