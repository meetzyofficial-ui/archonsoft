import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { SplitReveal } from "@/components/motion/SplitReveal";
import type { Project } from "@/data/projects";
import type { Screen } from "@/data/screens";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A project, given the shape its own material wants.
 *
 * Three compositions rather than one repeated card, because three products
 * that look nothing alike should not be presented as if they did. A hall of
 * browser boards is a wide, full-bleed thing; a phone app is a narrow column
 * of moments; a storefront is a two-column editorial spread. Which one a
 * project gets is an art-direction decision and it is written down as one, in
 * the project's own record, rather than inferred from the shape of a file.
 *
 * What they share is the vocabulary — an index, a sector, the name at the size
 * of a headline, the verified figures, and one way in — so the page reads as
 * one document even though no two chapters of it are laid out the same.
 */

export function WorkChapter({
  project,
  position,
  locale,
  copy,
}: {
  project: Project;
  position: number;
  locale: Locale;
  copy: Copy;
}) {
  const index = String(position).padStart(2, "0");
  const href = localePath(locale, `/work/${project.slug}`);
  const shared = { project, index, href, locale, copy };

  return (
    <section
      aria-labelledby={`work-${project.slug}`}
      className="relative"
    >
      {project.layout === "bleed" ? <Bleed {...shared} /> : null}
      {project.layout === "stack" ? <Stack {...shared} /> : null}
      {project.layout === "split" ? <Split {...shared} /> : null}
    </section>
  );
}

type Parts = {
  project: Project;
  index: string;
  href: string;
  locale: Locale;
  copy: Copy;
};

/* ------------------------------------------------------------------ bleed */

/**
 * Full width, and the name across it.
 *
 * For work whose screens are wider than they are tall: the plate takes the
 * whole frame and grows a little as it arrives, the name drifts up against it
 * as you pass, and the rest of the captures run off the right edge — which is
 * both the honest way to show a row of screens and the reason to keep going.
 */
function Bleed({ project, index, href, locale, copy }: Parts) {
  const rest = project.screens.slice(1, 4);
  return (
    <div className="pb-24 md:pb-36">
      <ScrollFrame className="relative">
        <Link href={href} data-cursor-label={copy.work.open} className="group block">
          <div className="relative overflow-hidden">
            <div className="rise-bleed wipe-up">
              <Image
                src={project.screens[0]!.image}
                alt={t(project.screens[0]!.caption, locale)}
                placeholder="blur"
                sizes="100vw"
                className="h-[62svh] w-full object-cover object-top md:h-auto"
              />
            </div>
          </div>
        </Link>
      </ScrollFrame>

      {/* The name goes under the picture, not over it.
          Set across the foot of the plate it had to survive whatever the
          screenshot happened to be doing there — and a board of white cards is
          the one background a difference blend cannot be read against. Under
          it, at the same size, the picture stays a picture and the name stays
          legible on every project this composition will ever hold. */}
      <div className="frame">
        <ScrollFrame className="overflow-hidden">
          <h2 id={`work-${project.slug}`} className="text-section drift-up mt-8 md:mt-10">
            <SplitReveal text={project.name} lineHeight="0.84em" stagger={34} />
          </h2>
        </ScrollFrame>
        <MetaRow project={project} index={index} locale={locale} copy={copy} />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="text-quote max-w-[24ch] text-balance">{t(project.statement, locale)}</p>
          </Reveal>
          <Reveal className="md:col-span-5 md:col-start-8" delay={90}>
            <p className="max-w-[46ch] text-lead text-[var(--fg-dim)]">
              {t(project.summary, locale)}
            </p>
            <WayIn href={href} copy={copy} />
          </Reveal>
        </div>
      </div>

      {/* The rest of the screens, running off the edge. */}
      <ScrollFrame className="mt-14 overflow-hidden md:mt-20">
        <ul
          className="drift-side flex gap-4 md:gap-6"
          style={{ ["--travel" as string]: "9%" }}
        >
          {rest.map((screen, i) => (
            <li
              key={i}
              className="w-[78vw] shrink-0 md:w-[46vw] lg:w-[38vw]"
              style={{ marginTop: `${i * 2.2}rem` }}
            >
              <Plate screen={screen} locale={locale} sizes="(min-width: 1024px) 38vw, 78vw" />
            </li>
          ))}
        </ul>
      </ScrollFrame>
    </div>
  );
}

/* ------------------------------------------------------------------ stack */

/**
 * A column of moments, with the name held beside it.
 *
 * For a phone product: the captures are narrow and there are several of them,
 * so they run down the page at alternating indents while the name, the figures
 * and the way in stay put in the margin. Standing still next to something that
 * is moving is what makes the movement legible.
 */
function Stack({ project, index, href, locale, copy }: Parts) {
  const screens = project.screens.slice(0, 4);
  return (
    <div className="frame py-24 md:py-36">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-28">
            <MetaRow project={project} index={index} locale={locale} copy={copy} compact />
            <h2 id={`work-${project.slug}`} className="text-section mt-6">
              <SplitReveal text={project.name} lineHeight="0.84em" stagger={34} />
            </h2>
            <Reveal delay={80}>
              <p className="mt-8 max-w-[38ch] text-lead text-[var(--fg-dim)]">
                {t(project.summary, locale)}
              </p>
              <p className="text-quote mt-8 max-w-[20ch] text-balance">
                {t(project.statement, locale)}
              </p>
              <WayIn href={href} copy={copy} />
            </Reveal>
          </div>
        </div>

        <ul className="md:col-span-6 md:col-start-7">
          {screens.map((screen, i) => (
            <li
              key={i}
              className={cn(
                "mx-auto w-[68vw] max-w-[340px] md:mx-0 md:w-[86%]",
                i % 2 === 1 && "md:ml-auto",
                i > 0 && "-mt-12 md:-mt-32",
              )}
            >
              <ScrollFrame className="rise-plate">
                <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
                  <Plate screen={screen} locale={locale} sizes="(min-width: 768px) 30vw, 68vw" />
                </Link>
              </ScrollFrame>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ split */

/**
 * Two columns, offset.
 *
 * For work that is itself a piece of visual design: the type takes one half,
 * one large capture takes the other, and a second capture hangs below and
 * across the gutter, drifting the other way — so the spread has a diagonal
 * running through it rather than two tidy rectangles.
 */
function Split({ project, index, href, locale, copy }: Parts) {
  const [first, second, third] = project.screens;
  return (
    <div className="frame py-24 md:py-36">
      <MetaRow project={project} index={index} locale={locale} copy={copy} />

      <div className="mt-10 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5 md:pt-16">
          <h2 id={`work-${project.slug}`} className="text-section">
            <SplitReveal text={project.name} lineHeight="0.84em" stagger={34} />
          </h2>
          <Reveal delay={80}>
            <p className="text-quote mt-8 max-w-[20ch] text-balance">
              {t(project.statement, locale)}
            </p>
            <p className="mt-8 max-w-[40ch] text-lead text-[var(--fg-dim)]">
              {t(project.summary, locale)}
            </p>
            <WayIn href={href} copy={copy} />
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <ScrollFrame className="rise-plate">
            <Plate screen={first!} locale={locale} sizes="(min-width: 768px) 46vw, 88vw" />
          </ScrollFrame>
        </div>
      </div>

      <div className="mt-10 grid gap-10 md:-mt-40 md:grid-cols-12 md:gap-8">
        {second ? (
          <div className="md:col-span-4 md:col-start-1">
            <ScrollFrame className="drift-down">
              <Plate screen={second} locale={locale} sizes="(min-width: 768px) 30vw, 88vw" />
            </ScrollFrame>
          </div>
        ) : null}
        {third ? (
          <div className="md:col-span-4 md:col-start-8 md:pt-24">
            <ScrollFrame className="rise-plate">
              <Plate screen={third} locale={locale} sizes="(min-width: 768px) 30vw, 88vw" />
            </ScrollFrame>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

/** A real capture, mounted the way its orientation asks for. */
function Plate({
  screen,
  locale,
  sizes,
}: {
  screen: Screen;
  locale: Locale;
  sizes: string;
}) {
  const wide = screen.image.width > screen.image.height;
  return (
    <figure>
      <div
        className={cn(
          "overflow-hidden border border-[var(--line)] bg-[var(--bg-raise)]",
          wide ? "rounded-[0.4rem]" : "rounded-[1.4rem] p-[3px]",
        )}
      >
        <Image
          src={screen.image}
          alt={t(screen.caption, locale)}
          placeholder="blur"
          sizes={sizes}
          className={cn("h-auto w-full", wide ? "" : "rounded-[1.25rem]")}
        />
      </div>
      <figcaption className="mono-label mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[var(--fg-mute)]">
        {/* Wrapping, not truncated. These captions describe what is in the
           picture, and half of one is worth less than two lines of it. */}
        <span>{t(screen.caption, locale)}</span>
        {screen.redacted ? (
          <span className="ml-auto shrink-0 opacity-70">
            {locale === "tr" ? "Veri maskeli" : "Data masked"}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** Index, sector, status and the figures — on one rule. */
function MetaRow({
  project,
  index,
  locale,
  copy,
  compact = false,
}: {
  project: Project;
  index: string;
  locale: Locale;
  copy: Copy;
  compact?: boolean;
}) {
  return (
    <Reveal
      variant="none"
      className={cn("hairline-t flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-4", !compact && "mt-8")}
    >
      <span className="mono-label reveal-fade text-[var(--accent)]">{index}</span>
      <span className="mono-label reveal-fade text-[var(--fg-dim)]">
        {t(project.category, locale)}
      </span>
      <span className="mono-label reveal-fade ml-auto text-[var(--fg-mute)]">
        {copy.work.live}
      </span>
      {!compact ? (
        <dl className="reveal-fade mono-label flex w-full flex-wrap gap-x-8 gap-y-1 pt-3 text-[var(--fg-mute)]">
          {project.facts.slice(0, 4).map((fact) => (
            <div key={fact.label.en} className="flex gap-2">
              <dt>{t(fact.label, locale)}</dt>
              <dd className="text-[var(--fg-dim)]">{t(fact.value, locale)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Reveal>
  );
}

function WayIn({ href, copy }: { href: string; copy: Copy }) {
  return (
    <Link
      href={href}
      data-cursor-label={copy.work.open}
      className="mono-label link-rule group mt-10 inline-flex items-center gap-3 text-[var(--fg)]"
    >
      {copy.work.read}
      <span
        aria-hidden="true"
        className="block h-px w-10 origin-left bg-current transition-transform duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-x-[1.8]"
      />
    </Link>
  );
}
