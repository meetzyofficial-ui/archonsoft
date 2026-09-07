import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ExplodedScreen } from "@/components/product/ExplodedScreen";
import { ProductPlane } from "@/components/product/ProductPlane";
import { ContactCta } from "@/components/sections/ContactCta";
import { Band, ChapterHead } from "@/components/ui/primitives";
import { PROJECTS, getNextProject, getProject } from "@/data/projects";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, t, type Locale } from "@/lib/i18n";
import { optimizedSrc } from "@/lib/imageSrc";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    PROJECTS.map((project) => ({ locale, slug: project.slug })),
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = getProject(slug);
  if (!project) return { title: "404" };

  const title = `${project.name} — ${t(project.category, locale)}`;
  const description = t(project.summary, locale);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/work/${project.slug}`,
      languages: {
        en: `/en/work/${project.slug}`,
        tr: `/tr/work/${project.slug}`,
      },
    },
    openGraph: { type: "article", title, description, url: `/${locale}/work/${project.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(project.slug);
  const chapters = project.sections;
  const closing = chapters.length > 1 ? chapters[chapters.length - 1] : undefined;
  const body = closing ? chapters.slice(0, -1) : chapters;

  const meta = [
    { label: copy.work.role, value: t(project.role, locale) },
    { label: copy.work.systemLabel, value: t(project.system, locale) },
    { label: copy.work.platform, value: t(project.platform, locale) },
  ];

  const lead = {
    src: optimizedSrc(project.lead.image, 760),
    width: project.lead.image.width,
    height: project.lead.image.height,
    alt: t(project.lead.caption, locale),
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    headline: `${project.name} — ${t(project.category, locale)}`,
    abstract: t(project.summary, locale),
    description: t(project.standfirst, locale),
    url: `${SITE.url}/${locale}/work/${project.slug}`,
    inLanguage: locale,
    creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
    ...(project.link ? { sameAs: [project.link.href] } : {}),
  };

  return (
    <div style={{ ["--accent" as string]: project.accent }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Opening */}
      <Band scheme="dark" size="tight" className="pt-[calc(72px+3.5rem)] md:pt-[calc(72px+5rem)]">
        <div className="frame">
          <ChapterHead
            index={copy.work.caseStudy}
            title={t(project.category, locale)}
            aside={copy.work.live}
          />

          <h1 className="mt-11 text-mega md:mt-14">
            <SplitReveal text={project.name} immediate lineHeight="0.86em" stagger={40} delay={120} />
          </h1>

          <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
            {/* The assembly, on the real lead screen. */}
            <div className="mx-auto w-[min(72vw,300px)] md:col-span-4 md:mx-0 md:w-full md:max-w-[320px]">
              <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line-strong)] bg-[var(--bg-raise)] p-[3px]">
                <ExplodedScreen
                  src={lead.src}
                  width={lead.width}
                  height={lead.height}
                  alt={lead.alt}
                  bands={5}
                  trigger="scroll"
                  readouts={["01", "02", "03", "04"]}
                  className="overflow-hidden rounded-[1.42rem]"
                />
              </div>
              <p className="mono-label mt-3 text-[var(--fg-mute)]">{copy.work.screensNote}</p>
            </div>

            <div className="md:col-span-7 md:col-start-6">
              <Reveal variant="rise">
                <p className="text-lead text-[var(--fg-dim)]">{t(project.standfirst, locale)}</p>
              </Reveal>

              <dl className="mt-10">
                {meta.map((item, i) => (
                  <Reveal
                    key={item.label}
                    delay={i * 70}
                    className="hairline-t grid grid-cols-1 gap-x-6 py-4 sm:grid-cols-[9rem_1fr]"
                  >
                    <dt className="mono-label pt-1 text-[var(--fg-mute)]">{item.label}</dt>
                    <dd className="text-[var(--fg)]">{item.value}</dd>
                  </Reveal>
                ))}
                {project.facts.map((fact, i) => (
                  <Reveal
                    key={fact.label.en}
                    delay={(meta.length + i) * 70}
                    className="hairline-t grid grid-cols-1 gap-x-6 py-4 sm:grid-cols-[9rem_1fr]"
                  >
                    <dt className="mono-label pt-1 text-[var(--fg-mute)]">
                      {t(fact.label, locale)}
                    </dt>
                    <dd className="text-[var(--fg)]">{t(fact.value, locale)}</dd>
                  </Reveal>
                ))}
              </dl>

              {project.link ? (
                <Reveal className="mt-8">
                  <a
                    href={project.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mono-label link-rule inline-flex items-center gap-3 text-[var(--accent)]"
                  >
                    {copy.work.visit} — {project.link.label}
                    <span aria-hidden="true" className="block h-px w-8 bg-current" />
                  </a>
                </Reveal>
              ) : null}
            </div>
          </div>
        </div>
      </Band>

      {/* The argument */}
      <Band scheme="light" size="regular">
        <div className="frame">
          <ChapterHead index="—" title={copy.work.theArgument} aside={project.name} />
          <ScrollLit
            as="p"
            className="mt-12 max-w-[22ch] text-d1 md:mt-16"
            text={t(project.statement, locale)}
          />
        </div>
      </Band>

      {/* Inside the product */}
      <Band scheme="dark" size="regular">
        <div className="frame">
          <ChapterHead
            index="—"
            title={copy.work.inside}
            aside={project.screens.some((s) => s.redacted) ? copy.work.maskNote : copy.work.live}
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
            {project.screens.map((screen, i) => (
              <Reveal key={i} delay={i * 80}>
                <ProductPlane
                  screen={screen}
                  locale={locale}
                  index={`${String(i + 1).padStart(2, "0")}`}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 88vw"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      {/* What the shipped system actually contains.
          Nothing in this list is inferred. Every area is either something the
          person who built it stated, or something plainly visible in the
          capture beside it — which is what makes it worth printing at all. */}
      {project.systemAreas ? (
        <Band scheme="light" size="regular">
          <div className="frame">
            <ChapterHead
              index="—"
              title={t(project.systemAreas.title, locale)}
              aside={copy.provenance.shipped}
            />

            <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:gap-12">
              <Reveal className="lg:col-span-7">
                <ul className="hairline-t grid sm:grid-cols-2">
                  {project.systemAreas.areas.map((area, i) => (
                    <li
                      key={area.en}
                      className="hairline-b flex items-baseline gap-4 py-4 sm:odd:pr-6 sm:even:pl-6"
                    >
                      <span className="mono-label shrink-0 text-[var(--accent)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="display text-[1.25rem] tracking-[-0.02em]">
                        {t(area, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 max-w-[62ch] text-[var(--fg-dim)]">
                  {t(project.systemAreas.note, locale)}
                </p>
              </Reveal>

              <Reveal className="lg:col-span-5" delay={120}>
                <ProductPlane
                  screen={project.systemAreas.screen}
                  locale={locale}
                  index={copy.provenance.shipped}
                  sizes="(min-width: 1024px) 34vw, 80vw"
                />
              </Reveal>
            </div>
          </div>
        </Band>
      ) : null}

      {/* Chapters, with the remaining screens set between them */}
      <Band scheme="dark" size="regular" className="pt-0">
        <div className="frame">
          {body.map((section, position) => (
            <Fragment key={section.index}>
              <section className="hairline-t grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                <header className="md:col-span-4">
                  <div className="md:sticky md:top-28">
                    <span className="mono-label text-[var(--accent)]">{section.index}</span>
                    <h2 className="mt-4 text-d3">{t(section.title, locale)}</h2>
                  </div>
                </header>
                <div className="md:col-span-7 md:col-start-6">
                  <Reveal>
                    {section.body[locale].map((paragraph, index) => (
                      <p
                        key={index}
                        className="max-w-[62ch] text-lead text-[var(--fg-dim)] [&+p]:mt-6"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </Reveal>
                </div>
              </section>

              {project.detail[position] ? (
                <Reveal className="hairline-t grid gap-8 py-10 md:grid-cols-12 md:py-14">
                  <div className="mx-auto w-[min(64vw,260px)] md:col-span-3 md:col-start-6 md:mx-0 md:w-full">
                    <ProductPlane
                      screen={project.detail[position]!}
                      locale={locale}
                      index={`D/${String(position + 1).padStart(2, "0")}`}
                      sizes="(min-width: 768px) 24vw, 64vw"
                    />
                  </div>
                </Reveal>
              ) : null}
            </Fragment>
          ))}
        </div>
      </Band>

      {/* Outcome */}
      {closing ? (
        <Band scheme="light" size="regular">
          <div className="frame">
            <ChapterHead index={closing.index} title={t(closing.title, locale)} aside={project.name} />
            <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-12">
              <div className="md:col-span-9">
                {closing.body[locale].map((paragraph, index) => (
                  <p key={index} className="display max-w-[46ch] text-d3 [&+p]:mt-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Band>
      ) : null}

      {/* Next */}
      <Band scheme="dark" size="regular">
        <div className="frame">
          <Link
            href={`/${locale}/work/${next.slug}`}
            data-cursor-label={copy.work.open}
            className="group hairline-t block pt-8"
            aria-label={`${copy.work.next}: ${next.name}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="mono-label text-[var(--fg-mute)]">{copy.work.next}</span>
              <span className="mono-label text-[var(--fg-mute)]">{t(next.category, locale)}</span>
            </div>

            <h2 className="mt-10 text-mega transition-transform duration-[900ms] ease-[var(--ease-out-expo)] md:group-hover:translate-x-4">
              {next.name}
            </h2>

            <div className="mt-8 grid items-end gap-8 md:grid-cols-12">
              <div className="md:col-span-6">
                <p className="max-w-[40ch] text-lead text-[var(--fg-dim)]">
                  {t(next.summary, locale)}
                </p>
              </div>
              <div className="mx-auto w-[min(50vw,180px)] md:col-span-3 md:col-start-10 md:mx-0 md:w-full">
                <ProductPlane
                  screen={next.lead}
                  locale={locale}
                  showCaption={false}
                  sizes="(min-width: 768px) 18vw, 50vw"
                />
              </div>
            </div>
          </Link>
        </div>
      </Band>

      <div style={{ ["--accent" as string]: "" }}>
        <ContactCta locale={locale} copy={copy} index="—" />
      </div>
    </div>
  );
}
