import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { ScrollLit } from "@/components/motion/ScrollLit";
import { MediaPlate } from "@/components/projects/MediaPlate";
import { StoreLinks } from "@/components/projects/StoreLinks";
import { ProjectStage } from "@/components/projects/ProjectStage";
import { SectionRule } from "@/components/ui/primitives";
import { WorldEnterButton } from "@/components/world/WorldInvite";
import { panelStyle } from "@/data/panels";
import { projectPath, type ShowcaseChapter, type ShowcaseProject } from "@/data/showcase";
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
  const status = project.facts.find((fact) => /status/i.test(fact.label.en));
  const facts = project.facts.filter((fact) => fact !== status);
  const redacted = project.gallery.some((media) => media.redacted);
  const phones = project.gallery.every((media) => media.kind === "phone");
  const hasLive = Boolean(project.link || project.demo || project.world);

  const lead = project.hero[0]!;

  return (
    <div>
      <section className="case-hero pt-[var(--header-h)]" style={panelStyle(project.slug)}>
        <div className="frame pt-8 pb-12 md:pt-12 md:pb-16">
          <Link href={localePath(locale, "/projects")} className="link-rule mono-label">
            ← {c.back}
          </Link>
          <h1 className="text-display mt-8">{project.title}</h1>
          <div className="mt-6 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="text-head max-w-[26ch] md:col-span-7">{t(project.tagline, locale)}</p>
            {hasLive ? (
              <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
                <LiveActions project={project} locale={locale} copy={copy} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="frame pb-14 md:pb-20">
          {lead.kind === "phone" ? (
            <ProjectStage project={project} locale={locale} priority size="hero" />
          ) : (
            <Image
              src={lead.image}
              alt={t(lead.alt, locale)}
              priority
              placeholder="blur"
              sizes="92vw"
              className="h-auto w-full"
            />
          )}
        </div>
      </section>

      <section data-band="paper" className="py-14 md:py-24">
        <div className="frame grid gap-10 md:grid-cols-12 md:gap-10">
          <p className="text-sub md:col-span-6">{t(project.description, locale)}</p>
          <dl className="md:col-span-5 md:col-start-8">
            {[
              { label: c.role, value: t(project.role, locale) },
              { label: c.platform, value: t(project.platform, locale) },
              { label: c.services, value: project.services.map((one) => t(one, locale)).join(", ") },
              ...(project.result ? [] : facts).map((fact) => ({ label: t(fact.label, locale), value: t(fact.value, locale) })),
            ].map((row) => (
              <div key={row.label} className="hairline-t grid grid-cols-1 gap-x-6 py-3 sm:grid-cols-[8.5rem_1fr]">
                <dt className="text-[var(--fg-mute)]">{row.label}</dt>
                <dd className="font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------- idea */}
      <section data-scheme="haze" className="case-band relative py-16 md:py-28">
        <div className="frame">
          <SectionRule label={c.idea} />
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
        <section data-band="paper" className="relative py-16 md:py-28">
          <div className="frame">
            <SectionRule label={c.product} />
            <div className="mt-8 md:mt-12">
              {project.product.map((chapter, position) => (
                <Fragment key={chapter.index}>
                  <section className="hairline-t grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                    <header className="md:col-span-4">
                      <div className="md:sticky md:top-28">
                        <h3 className="text-head">{t(chapter.title, locale)}</h3>
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
      <section data-scheme="haze" className="case-band relative py-16 md:py-28">
        <div className="frame">
          <SectionRule label={c.experience} aside={redacted ? c.redacted : c.visuals} />
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
                  sizes={phones ? "(min-width: 1024px) 22vw, 45vw" : "(min-width: 768px) 46vw, 92vw"}
                />
              </ScrollFrame>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ built */}
      {project.built ? (
        <section data-band="paper" className="relative py-16 md:py-28">
          <div className="frame">
            <SectionRule label={c.built} aside={t(project.built.title, locale)} />
            <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12">
              <div className={project.built.media ? "lg:col-span-7" : "lg:col-span-12"}>
                <ul className={cn("hairline-t grid", project.built.media ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
                  {project.built.areas.map((area, i) => (
                    <Reveal as="li" key={area.en} delay={i * 40} className="hairline-b flex items-baseline gap-4 py-4 pr-4">
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
        <section data-scheme="haze" className="case-band relative py-16 md:py-28">
          <div className="frame">
            <SectionRule label={c.result} aside={t(project.result.title, locale)} />
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
        <section data-band="paper" className="relative py-16 md:py-28">
          <div className="frame">
            <SectionRule label={c.technology} />
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
        <section data-scheme="haze" className="case-band relative py-16 md:py-24">
          <div className="frame">
            <SectionRule label={c.liveProject} />
            <div className="mt-12 flex flex-wrap items-end justify-between gap-8 md:mt-16">
              <p className="text-section max-w-[16ch]">{project.title}</p>
              <div className="flex flex-wrap gap-3">
                <LiveActions project={project} locale={locale} copy={copy} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <NextProject next={next} locale={locale} copy={copy} />

    </div>
  );
}

/** The way on: the next project, its name at full size and its lead picture. */
export function NextProject({ next, locale, copy }: { next: ShowcaseProject; locale: Locale; copy: Copy }) {
  const c = copy.showcase;
  return (
    <section data-band="paper" className="relative py-16 md:py-28">
      <div className="frame">
        <Link
          href={localePath(locale, projectPath(next.slug))}
          aria-label={`${c.next}: ${next.title}`}
          className="group border-t-2 border-[var(--fg)] grid gap-8 pt-6 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-7">
            <span className="mono-micro text-[var(--fg-mute)]">{c.next}</span>
            <p className="text-project project-title mt-6">{next.title}</p>
            <p className="mt-6 max-w-[40ch] text-lead text-[var(--fg-dim)]">{t(next.tagline, locale)}</p>
            <span className="btn-raised mt-8 w-fit">
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
        <a href={project.link.href} target="_blank" rel="noreferrer" className="btn-raised btn-panel">
          {project.link.label}
          <span aria-hidden="true" className="arrow-rule" />
        </a>
      ) : null}
      {project.stores ? <StoreLinks stores={project.stores} /> : null}
      {project.demo ? (
        <a
          href={project.demo.href}
          target="_blank"
          rel="noreferrer"
          title={t(project.demo.note, locale)}
          className="btn-raised btn-ghost"
        >
          {t(project.demo.label, locale)}
        </a>
      ) : null}
    </>
  );
}
