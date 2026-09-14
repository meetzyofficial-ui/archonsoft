import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { MediaPlate } from "@/components/projects/MediaPlate";
import { ProjectStage } from "@/components/projects/ProjectStage";
import { ContactCta } from "@/components/sections/ContactCta";
import { SectionRule } from "@/components/ui/primitives";
import { WorldEnterButton } from "@/components/world/WorldInvite";
import { SHOWCASE, projectPath, type ShowcaseChapter, type ShowcaseProject } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A case study.
 *
 * The page answers the questions in the order a person deciding whether to
 * hire a studio asks them: what is it, why did it need to exist, what was
 * made, what is it like to use, what is inside it, what came of it, what is it
 * built on, and where is it. Each of those is a section with its own name, and
 * a section with nothing true to put in it is not rendered — no invented year,
 * no plausible technology list, no result that nobody measured.
 *
 * The opening continues what the index started: the same stage, now the width
 * of the page, and the same name, now the size of the screen.
 */
export function CaseStudy({
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
  const status = project.facts.find((fact) => /status/i.test(fact.label.en));
  const facts = project.facts.filter((fact) => fact !== status);
  const redacted = project.gallery.some((media) => media.redacted);
  const phones = project.gallery.every((media) => media.kind === "phone");
  const hasLive = Boolean(project.link || project.demo || project.world);

  /* Sections are numbered as they appear, so a case with nothing true to say
     under one heading does not leave a gap in the count. */
  const present = [
    "idea",
    project.product.length > 0 ? "product" : null,
    "experience",
    project.built ? "built" : null,
    project.result ? "result" : null,
    project.technologies || project.scale ? "technology" : null,
  ].filter(Boolean) as string[];
  const n = (key: string) => String(present.indexOf(key) + 1).padStart(2, "0");

  return (
    <div>
      {/* ---------------------------------------------------------- opening */}
      <section data-band="paper" className="relative pt-[calc(4rem+2.5rem)] pb-16 md:pt-[calc(4rem+4rem)] md:pb-24">
        <div className="frame">
          <div className="hairline-t mono-micro flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[var(--fg-mute)] md:gap-x-10">
            <Link href={localePath(locale, "/projects")} className="link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]">
              ← {c.back}
            </Link>
            <span className="text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {number}
            </span>
            <span>{c.caseStudy}</span>
            <span>{t(project.category, locale)}</span>
            {project.year ? <span>{project.year}</span> : null}
            <span className="ml-auto inline-flex items-center gap-2 text-[var(--fg-dim)]">
              <span aria-hidden="true" className="live-dot" />
              {c.live}
            </span>
          </div>

          <h1 className="text-project mt-8 md:mt-10">
            <SplitReveal text={project.title} immediate lineHeight="0.9em" stagger={40} delay={80} />
          </h1>
          <Reveal priority variant="rise" className="mt-6 max-w-[44rem] md:mt-8">
            <p className="text-head text-[var(--fg-dim)]">{t(project.tagline, locale)}</p>
          </Reveal>
        </div>

        <div className="frame mt-12 md:mt-16">
          <Reveal priority variant="fade">
            <ProjectStage project={project} locale={locale} priority size="hero" />
          </Reveal>
        </div>

        <div className="frame mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <p className="text-lead text-[var(--fg-dim)]">{t(project.description, locale)}</p>
            {hasLive ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <LiveActions project={project} locale={locale} copy={copy} />
              </div>
            ) : null}
          </div>
          <dl className="md:col-span-5 md:col-start-8">
            {[
              { label: c.role, value: t(project.role, locale) },
              { label: c.platform, value: t(project.platform, locale) },
              { label: c.services, value: project.services.map((one) => t(one, locale)).join(" · ") },
              ...(project.result ? [] : facts).map((fact) => ({ label: t(fact.label, locale), value: t(fact.value, locale) })),
            ].map((row, i) => (
              <Reveal
                key={row.label}
                delay={i * 60}
                className="hairline-t grid grid-cols-1 gap-x-6 py-4 sm:grid-cols-[8.5rem_1fr]"
              >
                <dt className="mono-micro pt-1 text-[var(--fg-mute)]">{row.label}</dt>
                <dd className="text-[var(--fg)]">{row.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------- idea */}
      <section data-band="haze" className="case-band relative py-24 md:py-36">
        <div className="frame">
          <SectionRule label={`${n("idea")} — ${c.idea}`} aside={project.title} />
          <ScrollLit as="p" className="mt-12 max-w-[20ch] text-section md:mt-16" text={t(project.statement, locale)} />
          {project.idea ? (
            <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-12">
              <h2 className="mono-label text-[var(--fg-mute)] md:col-span-4">{t(project.idea.title, locale)}</h2>
              <Paragraphs chapter={project.idea} locale={locale} className="md:col-span-7 md:col-start-6" />
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------- product */}
      {project.product.length > 0 ? (
        <section data-band="paper" className="relative py-24 md:py-36">
          <div className="frame">
            <SectionRule label={`${n("product")} — ${c.product}`} aside={t(project.category, locale)} />
            <div className="mt-8 md:mt-12">
              {project.product.map((chapter, position) => (
                <Fragment key={chapter.index}>
                  <section className="hairline-t grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                    <header className="md:col-span-4">
                      <div className="md:sticky md:top-28">
                        <span className="mono-micro text-[var(--accent)]">{chapter.index}</span>
                        <h3 className="mt-4 text-sub">{t(chapter.title, locale)}</h3>
                      </div>
                    </header>
                    <Paragraphs chapter={chapter} locale={locale} className="md:col-span-7 md:col-start-6" />
                  </section>
                  {project.interludes[position] ? (
                    <ScrollFrame enter={0.55} className="rise-plate pb-12 md:pb-16">
                      <div
                        className={cn(
                          project.interludes[position]!.kind === "phone"
                            ? "mx-auto w-[min(62vw,280px)] md:ml-[41.66%] md:mr-0"
                            : "md:ml-[16.66%] md:w-[66%]",
                        )}
                      >
                        <MediaPlate
                          media={project.interludes[position]!}
                          locale={locale}
                          sizes={project.interludes[position]!.kind === "phone" ? "280px" : "(min-width: 768px) 66vw, 92vw"}
                        />
                      </div>
                    </ScrollFrame>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------- experience */}
      <section data-band="haze" className="case-band relative py-24 md:py-36">
        <div className="frame">
          <SectionRule label={`${n("experience")} — ${c.experience}`} aside={redacted ? c.redacted : c.visuals} />
          <div
            className={cn(
              "mt-12 grid gap-x-6 gap-y-12 md:mt-16",
              phones ? "grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2",
            )}
          >
            {project.gallery.map((media, i) => (
              <ScrollFrame key={i} enter={0.5} className={cn("rise-plate", !phones && i === 0 && project.gallery.length % 2 === 1 ? "md:col-span-2" : null)}>
                <MediaPlate
                  media={media}
                  locale={locale}
                  index={String(i + 1).padStart(2, "0")}
                  sizes={phones ? "(min-width: 1024px) 22vw, 45vw" : "(min-width: 768px) 46vw, 92vw"}
                />
              </ScrollFrame>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ built */}
      {project.built ? (
        <section data-band="paper" className="relative py-24 md:py-36">
          <div className="frame">
            <SectionRule label={`${n("built")} — ${c.built}`} aside={t(project.built.title, locale)} />
            <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12">
              <div className={project.built.media ? "lg:col-span-7" : "lg:col-span-12"}>
                <ul className={cn("hairline-t grid", project.built.media ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
                  {project.built.areas.map((area, i) => (
                    <Reveal as="li" key={area.en} delay={i * 40} className="hairline-b flex items-baseline gap-4 py-4 pr-4">
                      <span className="mono-micro shrink-0 text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[1.125rem] font-medium tracking-[-0.02em]">{t(area, locale)}</span>
                    </Reveal>
                  ))}
                </ul>
                <p className="mt-7 max-w-[60ch] text-[var(--fg-dim)]">{t(project.built.note, locale)}</p>
              </div>
              {project.built.media ? (
                <Reveal className="lg:col-span-5" delay={120}>
                  <div className={project.built.media.kind === "phone" ? "mx-auto max-w-[300px]" : undefined}>
                    <MediaPlate
                      media={project.built.media}
                      locale={locale}
                      sizes={project.built.media.kind === "phone" ? "300px" : "(min-width: 1024px) 36vw, 92vw"}
                    />
                  </div>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ----------------------------------------------------------- result */}
      {project.result ? (
        <section data-band="haze" className="case-band relative py-24 md:py-36">
          <div className="frame">
            <SectionRule label={`${n("result")} — ${c.result}`} aside={t(project.result.title, locale)} />
            <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
              <div className="md:col-span-8">
                {project.result.body[locale].map((paragraph, index) => (
                  <p key={index} className="text-head max-w-[30ch] text-[var(--fg)] [&+p]:mt-8">
                    {paragraph}
                  </p>
                ))}
              </div>
              {facts.length > 0 ? (
                <dl className="grid content-start gap-6 md:col-span-3 md:col-start-10">
                  {facts.map((fact) => (
                    <div key={fact.label.en} className="hairline-t pt-3">
                      <dt className="mono-micro text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
                      <dd className="mt-2 text-sub">{t(fact.value, locale)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------- technology */}
      {project.technologies || project.scale ? (
        <section data-band="paper" className="relative py-24 md:py-36">
          <div className="frame">
            <SectionRule label={`${n("technology")} — ${c.technology}`} aside={project.title} />
            <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-12">
              {project.technologies ? (
                <dl className="md:col-span-7">
                  {project.technologies.map((row, i) => (
                    <Reveal
                      key={row.label.en}
                      delay={i * 50}
                      className="hairline-t grid grid-cols-1 gap-x-6 py-4 sm:grid-cols-[8.5rem_1fr]"
                    >
                      <dt className="mono-micro pt-1 text-[var(--fg-mute)]">{t(row.label, locale)}</dt>
                      <dd className="text-[var(--fg)]">{t(row.value, locale)}</dd>
                    </Reveal>
                  ))}
                </dl>
              ) : null}
              {project.scale ? (
                <div className="md:col-span-4 md:col-start-9">
                  <p className="mono-micro text-[var(--fg-mute)]">{c.scale}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
                    {project.scale.map((row) => (
                      <div key={row.label.en} className="flex flex-col-reverse">
                        <dt className="mono-micro mt-1 text-[var(--fg-mute)]">{t(row.label, locale)}</dt>
                        <dd className="text-head" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- live */}
      {hasLive ? (
        <section data-band="haze" className="case-band relative py-24 md:py-32">
          <div className="frame">
            <SectionRule label={c.liveProject} aside={project.title} />
            <div className="mt-12 flex flex-wrap items-end justify-between gap-8 md:mt-16">
              <p className="text-section max-w-[16ch]">{project.title}</p>
              <div className="flex flex-wrap gap-3">
                <LiveActions project={project} locale={locale} copy={copy} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- next */}
      <section data-band="paper" className="relative py-24 md:py-36">
        <div className="frame">
          <Link
            href={localePath(locale, projectPath(next.slug))}
            data-cursor-label={c.exploreShort}
            aria-label={`${c.next}: ${next.title}`}
            className="group hairline-t grid gap-8 pt-6 md:grid-cols-12 md:items-end"
          >
            <div className="md:col-span-7">
              <span className="mono-micro text-[var(--fg-mute)]">{c.next}</span>
              <p className="text-project project-title mt-6">{next.title}</p>
              <p className="mt-6 max-w-[40ch] text-lead text-[var(--fg-dim)]">{t(next.tagline, locale)}</p>
              <span className="btn-raised mono-label mt-8 w-fit">
                {c.explore}
                <span aria-hidden="true" className="arrow-rule" />
              </span>
            </div>
            <div className="md:col-span-5">
              <div className="next-thumb relative overflow-hidden rounded-[1rem]">
                <Image
                  src={next.hero[0]!.image}
                  alt={t(next.hero[0]!.alt, locale)}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 768px) 36vw, 92vw"
                  className={cn(
                    "object-cover transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]",
                    next.hero[0]!.kind === "scene" ? null : "object-top",
                  )}
                />
              </div>
            </div>
          </Link>
        </div>
      </section>

      <ContactCta locale={locale} copy={copy} />
    </div>
  );
}

function Paragraphs({
  chapter,
  locale,
  className,
}: {
  chapter: ShowcaseChapter;
  locale: Locale;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      {chapter.body[locale].map((paragraph, index) => (
        <p key={index} className="max-w-[62ch] text-lead text-[var(--fg-dim)] [&+p]:mt-6">
          {paragraph}
        </p>
      ))}
    </Reveal>
  );
}

/** Where the work is: its front door, a running instance, or the world. */
function LiveActions({ project, locale, copy }: { project: ShowcaseProject; locale: Locale; copy: Copy }) {
  const c = copy.showcase;
  return (
    <>
      {project.world ? <WorldEnterButton locale={locale} label={c.enterWorld} /> : null}
      {project.link ? (
        <a href={project.link.href} target="_blank" rel="noreferrer" className="btn-raised mono-label">
          {c.visit} — {project.link.label}
          <span aria-hidden="true" className="arrow-rule" />
        </a>
      ) : null}
      {project.demo ? (
        <a
          href={project.demo.href}
          target="_blank"
          rel="noreferrer"
          title={t(project.demo.note, locale)}
          className="btn-raised btn-ghost mono-label"
        >
          {t(project.demo.label, locale)}
        </a>
      ) : null}
    </>
  );
}
