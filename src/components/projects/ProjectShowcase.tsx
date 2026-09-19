import Link from "next/link";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { ProjectStage } from "@/components/projects/ProjectStage";
import { SHOWCASE, projectPath, type ShowcaseProject } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Selected projects.
 *
 * Not a grid of cards. Each project is a spread of its own: the name set
 * larger than anything else on the page, the work staged under it, and beside
 * the stage the three things a visitor needs to decide whether to go in —
 * what it is, what was built, and what it runs on. The side the stage sits on
 * alternates, so the sequence has a rhythm without any project being treated
 * as the important one.
 *
 * The whole spread is one link. Hovering anywhere on it brings the stage
 * forward, the devices turn toward the pointer, the edge lights in the
 * product's own colour and the arrow travels; the robot cursor says what the
 * click will do. Arrival is driven by scroll: the name rises, and the devices
 * spread out of the stack as the frame comes into view.
 */
export function ProjectShowcase({
  locale,
  copy,
  heading = true,
  id = "projects",
}: {
  locale: Locale;
  copy: Copy;
  /** The projects page has its own header and hides this one. */
  heading?: boolean;
  id?: string;
}) {
  const c = copy.showcase;
  return (
    <section id={id} data-band="paper" className="relative pt-24 pb-16 md:pt-36 md:pb-24">
      {heading ? (
        <div className="frame">
          <ScrollFrame enter={0.45}>
            <div className="hairline-t mono-micro rise-copy flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]">
              <span>{c.label}</span>
              <span>{c.aside}</span>
            </div>
            <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end">
              <h2 className="text-section rise-copy md:col-span-8">
                {c.statement} <span className="text-[var(--fg-mute)]">{c.statementAccent}</span>
              </h2>
              <p className="rise-copy text-lead text-[var(--fg-dim)] md:col-span-4">{c.body}</p>
            </div>
          </ScrollFrame>

          {/* The index: every project by name, a jump to each. */}
          <nav aria-label={c.label} className="mt-12 md:mt-16">
            <ol className="hairline-t grid grid-cols-2 md:grid-cols-5">
              {SHOWCASE.map((project, index) => (
                <li key={project.slug} className="hairline-b md:border-b-0">
                  <a
                    href={`#project-${project.slug}`}
                    className="group flex items-baseline gap-3 py-4 pr-4 text-[var(--fg-mute)] transition-colors duration-300 hover:text-[var(--fg)]"
                  >
                    <span className="mono-micro text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.95rem] font-medium tracking-[-0.01em]">{project.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-24 md:gap-40", heading ? "mt-20 md:mt-28" : null)}>
        {SHOWCASE.map((project, index) => (
          <ProjectSpread
            key={project.slug}
            project={project}
            index={index}
            locale={locale}
            copy={copy}
            priority={!heading && index === 0}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectSpread({
  project,
  index,
  locale,
  copy,
  priority,
}: {
  project: ShowcaseProject;
  index: number;
  locale: Locale;
  copy: Copy;
  priority: boolean;
}) {
  const c = copy.showcase;
  const href = localePath(locale, projectPath(project.slug));
  const flip = index % 2 === 1;

  return (
    <article
      id={`project-${project.slug}`}
      aria-labelledby={`project-title-${project.slug}`}
      className="scroll-mt-24"
    >
      <Link href={href} data-cursor-label={c.exploreShort} className="group frame block">
        {/* The record. */}
        <ScrollFrame enter={0.4}>
          <div className="hairline-t mono-micro rise-copy flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[var(--fg-mute)] md:gap-x-10">
            <span className="text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{t(project.category, locale)}</span>
            {project.year ? <span>{project.year}</span> : null}
            <span className="ml-auto inline-flex items-center gap-2 text-[var(--fg-dim)]">
              <span aria-hidden="true" className="live-dot" />
              {c.live}
            </span>
          </div>
        </ScrollFrame>

        {/* The name, the size of the page. */}
        <ScrollFrame enter={0.5} className="mt-6 md:mt-8">
          <h3
            id={`project-title-${project.slug}`}
            className={cn(
              "text-project project-title rise-copy",
              flip ? "md:text-right" : null,
            )}
          >
            {project.title}
          </h3>
        </ScrollFrame>

        <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-12 md:gap-10">
          <ScrollFrame
            enter={0.62}
            className={cn("rise-plate md:col-span-8", flip ? "md:order-2 md:col-start-5" : null)}
          >
            <ProjectStage project={project} locale={locale} priority={priority} />
          </ScrollFrame>

          <ScrollFrame
            enter={0.5}
            className={cn(
              "flex flex-col justify-end md:col-span-4",
              flip ? "md:order-1 md:col-start-1 md:row-start-1" : null,
            )}
          >
            <div className="rise-copy">
              <p className="text-sub text-[var(--fg)]">{t(project.tagline, locale)}</p>
              <p className="mt-5 text-[var(--fg-dim)]">{t(project.shortDescription, locale)}</p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li key={tag.en} className="chip mono-micro">
                    {t(tag, locale)}
                  </li>
                ))}
              </ul>

              <dl className="hairline-t mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 pt-4">
                <dt className="mono-micro pt-[0.2rem] text-[var(--fg-mute)]">{c.services}</dt>
                <dd className="text-[0.875rem] text-[var(--fg-dim)]">
                  {project.services.map((service) => t(service, locale)).join(" · ")}
                </dd>
              </dl>

              <span className="btn-raised mono-label mt-8 w-fit">
                {c.explore}
                <span aria-hidden="true" className="arrow-rule" />
              </span>
            </div>
          </ScrollFrame>
        </div>
      </Link>
    </article>
  );
}
