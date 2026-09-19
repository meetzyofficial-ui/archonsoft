import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { NextProject } from "@/components/projects/CaseStudy";
import { ARACIMGO_COPY as A, ARACIMGO_DOMAIN, ARACIMGO_URL, type AracimGoChapter } from "@/data/aracimgo";
import { SHOWCASE, type ShowcaseProject } from "@/data/showcase";
import type { Screen } from "@/data/screens";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import logo from "@/assets/work/aracimgo/logo.png";

/**
 * AracımGo — Archon Soft's own product, told as a product.
 *
 * Every other case study on the site is a write-up of work; this one is the
 * page of a product that is live, so it reads the way a product page does:
 * what it is and where to open it, what it does, the problem it answers, the
 * product one job at a time — each with the product's own plate beside it and
 * a moment from a working day under it — then all of it in one look, and the
 * way in. It borrows the product's own language where the product is on show:
 * the chapters sit on AracımGo's cream, in its deep green and emerald, and the
 * night of the site closes round them.
 *
 * The plates are the team's own, shown whole. Nothing is cropped: the words on
 * them are part of the design.
 */
export function AracimGoStory({
  project,
  next,
  locale,
  copy,
}: {
  project: ShowcaseProject;
  next: ShowcaseProject;
  locale: Locale;
  copy: Copy;
}) {
  const c = copy.showcase;
  const number = String(SHOWCASE.findIndex((one) => one.slug === project.slug) + 1).padStart(2, "0");

  return (
    <div className="aracimgo">
      {/* ------------------------------------------------------------ hero */}
      <section data-band="paper" className="ag-hero relative overflow-hidden pt-[calc(4rem+2.5rem)] pb-20 md:pt-[calc(4rem+4rem)] md:pb-28">
        <div aria-hidden="true" className="ag-hero__glow" />
        <div className="frame relative">
          <div className="hairline-t mono-micro flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[var(--fg-mute)] md:gap-x-10">
            <Link href={localePath(locale, "/projects")} className="link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]">
              ← {c.back}
            </Link>
            <span className="text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {number}
            </span>
            <span>{t(project.category, locale)}</span>
          </div>

          <div className="mt-10 grid items-center gap-14 md:mt-14 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">
              <Reveal priority variant="fade">
                <p className="ag-badge mono-micro" data-aracimgo-badge>
                  <span aria-hidden="true" className="live-dot" />
                  {t(A.badge, locale)}
                </p>
              </Reveal>
              <div className="mt-7 flex items-center gap-5 md:gap-7">
                <span className="ag-logo shrink-0">
                  <Image src={logo} alt="" width={96} height={96} priority className="size-full" />
                </span>
                <h1 className="text-project">
                  <SplitReveal text={A.title} immediate lineHeight="0.9em" stagger={40} delay={80} />
                </h1>
              </div>
              <Reveal priority variant="rise" className="mt-8 max-w-[40rem]">
                <p className="text-head">{t(A.subtitle, locale)}</p>
                <p className="mt-6 max-w-[34rem] text-lead text-[var(--fg-dim)]">{t(A.description, locale)}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <a
                    href={ARACIMGO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-aracimgo-cta="inspect"
                    className="btn-raised btn-aracimgo mono-label"
                  >
                    {t(A.inspect, locale)}
                    <span aria-hidden="true">→</span>
                  </a>
                  <Link href={localePath(locale, "/contact")} data-aracimgo-cta="build" className="btn-raised btn-ghost mono-label">
                    {t(A.build, locale)}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <p className="mono-micro mt-6 text-[var(--fg-mute)]">
                  {ARACIMGO_DOMAIN} · {t(A.by, locale)}
                </p>
              </Reveal>
            </div>
            <Reveal priority variant="fade" delay={120} className="md:col-span-5">
              <Plate screen={A.overviewPlate} locale={locale} priority sizes="(min-width: 768px) 30vw, 78vw" className="mx-auto w-[min(78vw,400px)] md:mr-0" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- capabilities */}
      <section data-band="paper" className="relative py-10 md:py-16" aria-labelledby="ag-capabilities">
        <div className="frame">
          <div className="ag-sheet px-6 py-12 md:px-14 md:py-20">
            <Reveal>
              <p className="mono-micro text-[var(--accent)]">01 — {t(A.capabilitiesLabel, locale)}</p>
              <h2 id="ag-capabilities" className="mt-5 max-w-[22ch] text-head">
                {t(A.capabilitiesLead, locale)}
              </h2>
            </Reveal>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-16" data-aracimgo-capabilities>
              {A.capabilities.map((one, i) => (
                <Reveal as="li" key={one.title.en} delay={i * 50} className="ag-card">
                  <span aria-hidden="true" className="ag-check">
                    ✓
                  </span>
                  <h3 className="mt-5 text-[1.125rem] font-medium tracking-[-0.02em]">{t(one.title, locale)}</h3>
                  <p className="mt-2 text-[var(--fg-dim)]">{t(one.body, locale)}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- problem */}
      <section data-band="haze" className="case-band relative py-24 md:py-36">
        <div className="frame">
          <p className="mono-micro text-[var(--fg-mute)]">
            <span className="ag-emerald">02</span> — {t(A.problemLabel, locale)}
          </p>
          <Reveal>
            <p className="mt-10 max-w-[18ch] text-section md:mt-14">{t(A.problemLine, locale)}</p>
          </Reveal>
          <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12">
            <ol className="md:col-span-7">
              {A.problems.map((line, i) => (
                <Reveal as="li" key={line.en} delay={i * 60} className="hairline-t flex items-baseline gap-5 py-5">
                  <span className="mono-micro text-[var(--fg-mute)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lead text-[var(--fg-dim)]">{t(line, locale)}</span>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={200} className="flex items-end md:col-span-4 md:col-start-9">
              <p className="text-head ag-emerald">{t(A.problemAnswer, locale)}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- chapters */}
      <section data-band="paper" className="relative py-10 md:py-16">
        <div className="frame">
          <div className="ag-sheet px-6 md:px-14">
            {A.chapters.map((chapter, i) => (
              <Chapter key={chapter.id} chapter={chapter} flip={i % 2 === 1} locale={locale} sceneLabel={t(A.sceneLabel, locale)} />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- summary */}
      <section data-band="haze" className="case-band relative py-24 md:py-36">
        <div className="frame grid items-center gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <p className="mono-micro text-[var(--fg-mute)]">
              <span className="ag-emerald">07</span> — {t(A.summaryLabel, locale)}
            </p>
            <Reveal>
              <p className="mt-8 max-w-[20ch] text-head">{t(A.summaryLine, locale)}</p>
              <p className="mt-6 max-w-[44ch] text-lead text-[var(--fg-dim)]">{t(A.summaryBody, locale)}</p>
            </Reveal>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {A.summaryList.map((item, i) => (
                <Reveal as="li" key={item.en} delay={i * 50} className="flex items-center gap-3">
                  <span aria-hidden="true" className="ag-check ag-check--dark">
                    ✓
                  </span>
                  <span className="text-[var(--fg)]">{t(item, locale)}</span>
                </Reveal>
              ))}
            </ul>
            <dl className="mt-12">
              {A.facts.map((row) => (
                <div key={row.label.en} className="hairline-t grid grid-cols-1 gap-x-6 py-3 sm:grid-cols-[8.5rem_1fr]">
                  <dt className="mono-micro pt-1 text-[var(--fg-mute)]">{t(row.label, locale)}</dt>
                  <dd className="text-[var(--fg)]">{t(row.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ScrollFrame enter={0.5} className="rise-plate md:col-span-5 md:col-start-8">
            <Plate screen={A.summaryPlate} locale={locale} sizes="(min-width: 768px) 30vw, 78vw" className="mx-auto w-[min(78vw,400px)]" />
          </ScrollFrame>
        </div>
      </section>

      {/* ------------------------------------------------------ studio / cta */}
      <section data-band="paper" className="ag-hero relative overflow-hidden py-24 md:py-36" data-aracimgo-final>
        <div aria-hidden="true" className="ag-hero__glow ag-hero__glow--low" />
        <div className="frame relative">
          <p className="mono-micro text-[var(--fg-mute)]">{t(A.studioLabel, locale)}</p>
          <Reveal>
            <p className="mt-8 max-w-[24ch] text-section">{t(A.studioLine, locale)}</p>
          </Reveal>
          <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
            <Reveal className="md:col-span-6">
              <p className="max-w-[48ch] text-lead text-[var(--fg-dim)]">{t(A.studioBody, locale)}</p>
            </Reveal>
            <Reveal delay={120} className="md:col-span-5 md:col-start-8">
              <p className="text-sub">{t(A.ctaLine, locale)}</p>
              <p className="mt-3 text-[var(--fg-dim)]">{t(A.ctaBody, locale)}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={ARACIMGO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aracimgo-cta="open"
                  className="btn-raised btn-aracimgo mono-label"
                >
                  {t(A.open, locale)}
                  <span aria-hidden="true">→</span>
                </a>
                <Link href={localePath(locale, "/contact")} className="btn-raised btn-ghost mono-label">
                  {t(A.build, locale)}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <NextProject next={next} locale={locale} copy={copy} />
    </div>
  );
}

/** One job the product does: its own plate, its own line, and a moment from a working day. */
function Chapter({
  chapter,
  flip,
  locale,
  sceneLabel,
}: {
  chapter: AracimGoChapter;
  flip: boolean;
  locale: Locale;
  sceneLabel: string;
}) {
  return (
    <article
      id={`aracimgo-${chapter.id}`}
      data-aracimgo-chapter={chapter.id}
      className="ag-chapter grid items-center gap-10 py-14 md:grid-cols-12 md:gap-10 md:py-24"
    >
      <div className={cn("md:col-span-6", flip ? "md:order-2 md:col-start-7" : null)}>
        <Reveal>
          <p className="mono-micro text-[var(--accent)]">
            {chapter.index} — {t(chapter.label, locale)}
          </p>
          <h2 className="mt-5 max-w-[20ch] text-head">{t(chapter.line, locale)}</h2>
          <p className="mt-6 max-w-[46ch] text-lead text-[var(--fg-dim)]">{t(chapter.body, locale)}</p>
        </Reveal>
        <Reveal delay={120} className="ag-scene mt-8 max-w-[46ch]">
          <p className="mono-micro text-[var(--accent)]">{sceneLabel}</p>
          <p className="mt-3 text-[var(--fg)]">{t(chapter.scene, locale)}</p>
        </Reveal>
      </div>
      <ScrollFrame
        enter={0.5}
        className={cn("rise-plate md:col-span-5", flip ? "md:order-1 md:col-start-1" : "md:col-start-8")}
      >
        <Plate screen={chapter.plate} locale={locale} sizes="(min-width: 768px) 28vw, 74vw" className="mx-auto w-[min(74vw,360px)]" />
      </ScrollFrame>
    </article>
  );
}

/** A plate, whole: never cropped, the product's own shadow under it. */
function Plate({
  screen,
  locale,
  sizes,
  priority = false,
  className,
}: {
  screen: Screen;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("ag-plate", className)} style={{ aspectRatio: `${screen.image.width} / ${screen.image.height}` }}>
      <Image
        src={screen.image}
        alt={t(screen.caption, locale)}
        fill
        priority={priority}
        placeholder="blur"
        sizes={sizes}
        quality={88}
        className="object-contain"
      />
    </figure>
  );
}
