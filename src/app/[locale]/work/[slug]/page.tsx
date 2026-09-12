import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ExplodedScreen } from "@/components/product/ExplodedScreen";
import { ProductPlane } from "@/components/product/ProductPlane";
import { ContactCta } from "@/components/sections/ContactCta";
import { Band, SectionRule } from "@/components/ui/primitives";
import { PROJECTS, getNextProject, getProject, type Project } from "@/data/projects";
import { dict, type Copy } from "@/i18n/dictionary";
import { LOCALES, isLocale, t, type Locale } from "@/lib/i18n";
import { optimizedSrc } from "@/lib/imageSrc";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ locale: string; slug: string }> };


/**
 * The metadata rail: what the work is, and the figures behind it.
 *
 * Shared by both arms of the opening, because the only thing that changes
 * between a handset case study and a browser one is where this block sits.
 */
function MetaList({
  project,
  meta,
  locale,
  compact = false,
}: {
  project: Project;
  meta: { label: string; value: string }[];
  locale: Locale;
  /**
   * Stacked in two columns rather than run down the page.
   *
   * The wide opening puts this in a rail beside a standfirst that is four
   * lines long. Eight full-width rows against four lines of text left a
   * screen-and-a-half of empty column, which reads as a layout that has come
   * apart rather than as whitespace anybody chose.
   */
  compact?: boolean;
}) {
  if (compact) {
    const rows = [
      ...meta,
      ...project.facts.map((fact) => ({
        label: t(fact.label, locale),
        value: t(fact.value, locale),
      })),
    ];
    return (
      <dl className="mt-10 grid grid-cols-2 gap-x-6">
        {rows.map((row, i) => (
          <Reveal key={row.label} delay={i * 60} className="hairline-t py-4">
            <dt className="mono-label text-[var(--fg-mute)]">{row.label}</dt>
            <dd className="mt-1 text-[var(--fg)]">{row.value}</dd>
          </Reveal>
        ))}
      </dl>
    );
  }

  return (
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
          <dt className="mono-label pt-1 text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
          <dd className="text-[var(--fg)]">{t(fact.value, locale)}</dd>
        </Reveal>
      ))}
    </dl>
  );
}

/**
 * The ways out of the page and into the product.
 *
 * The front door first, then — where such a thing exists — a running instance
 * of the work itself. The second is the stronger invitation and is deliberately
 * the quieter of the two: a visitor who wants to use the thing will take it,
 * and one who does not should not be shouted at.
 */
function ProjectLinks({
  project,
  copy,
  locale,
}: {
  project: Project;
  copy: Copy;
  locale: Locale;
}) {
  if (!project.link && !project.demo) return null;
  return (
    <Reveal className="mt-8 flex flex-col gap-4">
      {project.link ? (
        <a
          href={project.link.href}
          target="_blank"
          rel="noreferrer"
          className="mono-label link-rule inline-flex w-fit items-center gap-3 text-[var(--accent)]"
        >
          {copy.work.visit} — {project.link.label}
          <span aria-hidden="true" className="block h-px w-8 bg-current" />
        </a>
      ) : null}
      {project.demo ? (
        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <a
            href={project.demo.href}
            target="_blank"
            rel="noreferrer"
            className="mono-label link-rule inline-flex w-fit items-center gap-3 text-[var(--fg)]"
          >
            {t(project.demo.label, locale)}
            <span aria-hidden="true" className="block h-px w-8 bg-current" />
          </a>
          <span className="mono-label text-[var(--fg-mute)]">{t(project.demo.note, locale)}</span>
        </span>
      ) : null}
    </Reveal>
  );
}

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

  /* Landscape captures are screens and portrait ones are handsets, and the
     opening of this page is laid out differently for each. */
  const wideLead = project.lead.image.width > project.lead.image.height;

  const lead = {
    /* Sized against what the layout actually asks for, not against the plate's
       CSS width. `getImageProps` doubles the number it is given for retina and
       then rounds up to the next configured device size, so 1400 quietly became
       a 3840-wide request — 217kB of hero on a page whose largest contentful
       paint is that hero, and it measured 3.9s against 1.4s everywhere else.
       960 lands on 1920, which still covers the widest plate at better than
       1.3×, and the lower quality tier is invisible at this scale on a
       screenshot that is mostly flat interface. */
    src: wideLead
      ? optimizedSrc(project.lead.image, 960, 75)
      : optimizedSrc(project.lead.image, 760),
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
    <div>
      {/* The opening screen is painted through `background-image`, which the
          preload scanner cannot see. On a case study it is also the largest
          thing on the page and it is above the fold, so left unannounced it
          became the last paint rather than the first — measured at 3.9s on a
          wide capture against 1.4s for every other route. Nothing covers this
          page the way the world covers the home page, so unlike there it can
          simply be declared. */}
      <link rel="preload" as="image" href={lead.src} fetchPriority="high" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Opening */}
      <Band scheme="paper" size="tight" className="pt-[calc(4rem+3rem)] md:pt-[calc(4rem+4.5rem)]">
        <div className="frame">
          {/* The masthead. Three lines of ten-pixel metadata on one rule, then
              the name at the size of the page — the same relationship the
              archive uses, so a visitor arriving from it recognises where they
              are before reading a word. */}
          <div className="hairline-t mono-micro flex flex-wrap items-center gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]">
            <span className="text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {String(PROJECTS.findIndex((one) => one.slug === project.slug) + 1).padStart(2, "0")}
            </span>
            <span>{copy.work.caseStudy}</span>
            <span>{t(project.category, locale)}</span>
            <span className="ml-auto">{copy.work.live}</span>
          </div>

          {/* The name, one step below the size the home page opens at.
              Nothing on an inner page is allowed the display size. */}
          <h1 className="text-section mt-8 md:mt-10">
            <SplitReveal text={project.name} immediate lineHeight="1em" stagger={40} delay={120} />
          </h1>

          {/* The opening frame follows the material.
              A phone capture is three hundred pixels wide and stands beside the
              standfirst; a browser capture is sixteen by nine and wants the
              whole column with the reading underneath. Branching on the shape
              of the lead screen rather than on the project keeps one template
              honest for both — squeezed into the slot built for a handset, a
              landscape screenshot is four hundred pixels of interface nobody
              can read. */}
          {wideLead ? (
            <div className="mt-12 md:mt-16">
              <div className="overflow-hidden rounded-[var(--radius-hair)]">
                <ExplodedScreen
                  src={lead.src}
                  width={lead.width}
                  height={lead.height}
                  alt={lead.alt}
                  bands={4}
                  trigger="enter"
                  delay={520}
                  readouts={["01", "02", "03"]}
                  className="overflow-hidden rounded-[0.44rem]"
                />
              </div>
              <p className="mono-label mt-3 text-[var(--fg-mute)]">{copy.work.screensNote}</p>

              <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-6">
                  <Reveal variant="rise" priority>
                    <p className="text-lead text-[var(--fg-dim)]">
                      {t(project.standfirst, locale)}
                    </p>
                  </Reveal>
                  <ProjectLinks project={project} copy={copy} locale={locale} />
                </div>
                <div className="md:col-span-5 md:col-start-8">
                  <MetaList project={project} meta={meta} locale={locale} compact />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
              {/* The assembly, on the real lead screen. */}
              <div className="mx-auto w-[min(72vw,300px)] md:col-span-4 md:mx-0 md:w-full md:max-w-[320px]">
                <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line-strong)] bg-[var(--bg-raise)] p-[3px]">
                  {/* Assembled on arrival, not on scroll.
                      On a case study this frame is above the fold, and the
                      scroll mapping left it stopped at just over half — bands
                      offset far enough to shear the glyphs in the screenshot
                      and not far enough to read as an exploded drawing, so the
                      first thing a visitor saw of the work looked like a
                      misregistered image. Driven by the page entrance it plays
                      the whole assembly once and ends clean, which is what the
                      home page's hero already does with the same component. */}
                  <ExplodedScreen
                    src={lead.src}
                    width={lead.width}
                    height={lead.height}
                    alt={lead.alt}
                    bands={5}
                    trigger="enter"
                    delay={520}
                    readouts={["01", "02", "03", "04"]}
                    className="overflow-hidden rounded-[1.42rem]"
                  />
                </div>
                <p className="mono-label mt-3 text-[var(--fg-mute)]">{copy.work.screensNote}</p>
              </div>

              <div className="md:col-span-7 md:col-start-6">
                <Reveal variant="rise" priority>
                  <p className="text-lead text-[var(--fg-dim)]">{t(project.standfirst, locale)}</p>
                </Reveal>
                <MetaList project={project} meta={meta} locale={locale} />
                <ProjectLinks project={project} copy={copy} locale={locale} />
              </div>
            </div>
          )}
        </div>
      </Band>

      {/* The argument */}
      <Band scheme="haze" size="regular">
        <div className="frame">
          <SectionRule label={copy.work.theArgument} aside={project.name} />
          <ScrollLit
            as="p"
            className="mt-12 max-w-[22ch] text-head md:mt-16"
            text={t(project.statement, locale)}
          />
        </div>
      </Band>

      {/* Inside the product */}
      <Band scheme="paper" size="regular">
        <div className="frame">
          <SectionRule
            label={copy.work.inside}
            aside={project.screens.some((s) => s.redacted) ? copy.work.maskNote : copy.work.live}
          />
          {/* Four across for handsets, two for browser captures. A sixteen
              by nine screen at a quarter of the width is a thumbnail of an
              interface, which is worth nothing to somebody deciding whether
              this studio can build their thing. */}
          <div
            className={cn(
              "mt-12 grid gap-8 md:mt-16",
              wideLead ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {project.screens.map((screen, i) => (
              <ScrollFrame key={i} className="rise-plate">
                <ProductPlane
                  screen={screen}
                  locale={locale}
                  index={`${String(i + 1).padStart(2, "0")}`}
                  sizes={
                    wideLead
                      ? "(min-width: 768px) 46vw, 92vw"
                      : "(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 88vw"
                  }
                />
              </ScrollFrame>
            ))}
          </div>
        </div>
      </Band>

      {/* What the shipped system actually contains.
          Nothing in this list is inferred. Every area is either something the
          person who built it stated, or something plainly visible in the
          capture beside it — which is what makes it worth printing at all. */}
      {project.systemAreas ? (
        <Band scheme="haze" size="regular">
          <div className="frame">
            <SectionRule
              label={t(project.systemAreas.title, locale)}
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
                  sizes="(min-width: 1024px) 34vw, 80vw"
                />
              </Reveal>
            </div>
          </div>
        </Band>
      ) : null}

      {/* Chapters, with the remaining screens set between them */}
      <Band scheme="paper" size="regular" className="pt-0">
        <div className="frame">
          {body.map((section, position) => (
            <Fragment key={section.index}>
              <section className="hairline-t grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                <header className="md:col-span-4">
                  <div className="md:sticky md:top-28">
                    <span className="mono-label text-[var(--accent)]">{section.index}</span>
                    <h2 className="mt-4 text-quote">{t(section.title, locale)}</h2>
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
                  {/* A browser capture takes the width it needs; a handset
                      keeps its 260px column. Same slot, same rhythm, sized by
                      what is actually in it. */}
                  <div
                    className={
                      project.detail[position]!.image.width >
                      project.detail[position]!.image.height
                        ? "md:col-span-10 md:col-start-2"
                        : "mx-auto w-[min(64vw,260px)] md:col-span-3 md:col-start-6 md:mx-0 md:w-full"
                    }
                  >
                    <ScrollFrame className="rise-plate">
                    <ProductPlane
                      screen={project.detail[position]!}
                      locale={locale}
                      index={`D/${String(position + 1).padStart(2, "0")}`}
                      sizes={
                        project.detail[position]!.image.width >
                        project.detail[position]!.image.height
                          ? "(min-width: 768px) 80vw, 92vw"
                          : "(min-width: 768px) 24vw, 64vw"
                      }
                    />
                    </ScrollFrame>
                  </div>
                </Reveal>
              ) : null}
            </Fragment>
          ))}
        </div>
      </Band>

      {/* What it is built on, and how big it is.
          Both blocks appear only where somebody stated the answer. A stack is
          the kind of thing that is easy to guess and impossible to guess
          right, and a repository's own counts are the only numbers this site
          is in a position to verify — so a project with neither renders
          neither, rather than a plausible list. */}
      {project.stack || project.scale ? (
        <Band scheme="paper" size="regular">
          <div className="frame">
            <SectionRule label={copy.work.built} aside={project.name} />
            <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
              {project.stack ? (
                <dl className="md:col-span-7">
                  {project.stack.map((row, i) => (
                    <Reveal
                      key={row.label.en}
                      delay={i * 60}
                      className="hairline-t grid grid-cols-1 gap-x-6 py-4 sm:grid-cols-[8rem_1fr]"
                    >
                      <dt className="mono-label pt-1 text-[var(--fg-mute)]">
                        {t(row.label, locale)}
                      </dt>
                      <dd className="text-[var(--fg)]">{t(row.value, locale)}</dd>
                    </Reveal>
                  ))}
                </dl>
              ) : null}

              {project.scale ? (
                <div className="md:col-span-4 md:col-start-9">
                  <p className="mono-label text-[var(--fg-mute)]">{copy.work.scaleNote}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
                    {project.scale.map((row) => (
                      <div key={row.label.en}>
                        <dd
                          className="display text-quote text-[var(--fg)]"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {row.value}
                        </dd>
                        <dt className="mono-label mt-1 text-[var(--fg-mute)]">
                          {t(row.label, locale)}
                        </dt>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>
        </Band>
      ) : null}

      {/* Outcome */}
      {closing ? (
        <Band scheme="haze" size="regular">
          <div className="frame">
            <SectionRule label={t(closing.title, locale)} aside={project.name} />
            <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-12">
              <div className="md:col-span-9">
                {closing.body[locale].map((paragraph, index) => (
                  <p key={index} className="display max-w-[46ch] text-quote [&+p]:mt-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Band>
      ) : null}

      {/* Next */}
      <Band scheme="paper" size="regular">
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

            <h2 className="mt-10 text-head transition-transform duration-[900ms] ease-[var(--ease-out-expo)] md:group-hover:translate-x-4">
              {next.name}
            </h2>

            {/* Aligned to the bottom against a screenshot that was as wide as
                the column allowed, this block opened a five-hundred-pixel hole
                between the name and the sentence under it. The picture is
                capped and the left column carries the way in, so the two sides
                are the same height and the block reads as one thing. */}
            <div className="mt-8 grid items-end gap-8 md:grid-cols-12">
              <div className="md:col-span-6">
                <p className="max-w-[40ch] text-lead text-[var(--fg-dim)]">
                  {t(next.summary, locale)}
                </p>
                <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  {next.facts.slice(0, 3).map((fact) => (
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
              <div className="mx-auto w-[min(46vw,150px)] md:col-span-3 md:col-start-10 md:mx-0 md:ml-auto md:w-[150px]">
                <ProductPlane
                  screen={next.lead}
                  locale={locale}
                  showCaption={false}
                  sizes="150px"
                />
              </div>
            </div>
          </Link>
        </div>
      </Band>

      <div style={{ ["--accent" as string]: "" }}>
        <ContactCta locale={locale} copy={copy} />
      </div>
    </div>
  );
}
