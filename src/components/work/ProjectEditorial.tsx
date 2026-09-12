import Image from "next/image";
import Link from "next/link";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import type { Project } from "@/data/projects";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One project, as a page of a publication.
 *
 * This replaces a full-viewport card stack, and the difference is the whole
 * argument of the redesign. That version gave every project the entire screen:
 * a 54vh photograph, a name at 8.4vw, and the next one dealt over the top of
 * it. Three of those in a row is not an editorial sequence, it is three
 * billboards, and nothing on the page could be larger than a project because
 * a project was already as large as the page.
 *
 * So the unit is small and the space around it is large. The picture is a bit
 * over half the column and around 40vh tall; the name is 34–68px rather than
 * a tenth of the viewport; the metadata is ten pixels; and between one project
 * and the next there is most of a screen of nothing. It should read as a
 * carefully placed image on a page, which is the one thing a card can never
 * read as — so there is no card: no border, no fill, no radius, no shadow, no
 * container of any kind. The photograph is the object.
 *
 * The order is fixed and is the same in the archive and here:
 *
 *   index · discipline · status   →   image   →   NAME   →   descriptor   →   ↗
 *
 * The picture is offset into the grid and the side alternates down the page,
 * so the sequence has a rhythm without any project being treated differently
 * from the others.
 */
export function ProjectEditorial({
  project,
  index,
  locale,
  copy,
  priority = false,
}: {
  project: Project;
  index: number;
  locale: Locale;
  copy: Copy;
  /** Set on the first unit: its picture is the largest paint on the page. */
  priority?: boolean;
}) {
  const href = localePath(locale, `/work/${project.slug}`);
  const screen = project.lead;
  const wide = screen.image.width > screen.image.height;
  const status = project.facts.find((fact) => /status|durum/i.test(fact.label.en))?.value;
  /* Left, right, left. The picture never sits in the same place twice
     running, and it is never centred — a centred image on a white page is a
     slide, not a spread. */
  const rightward = index % 2 === 1;

  return (
    <article
      className="group/unit"
      aria-labelledby={`project-${project.slug}`}
    >
      <Link href={href} data-cursor-label={copy.work.open} className="frame block">
        {/* 01 — the rule, and the ten-pixel record on it. */}
        <ScrollFrame enter={0.4}>
          <div className="hairline-t mono-micro rise-copy flex flex-wrap items-center gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]">
            <span
              className="text-[var(--accent)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{t(project.category, locale)}</span>
            {status ? <span className="sm:ml-auto">{t(status, locale)}</span> : null}
          </div>
        </ScrollFrame>

        {/* 02 — the picture. Offset, held to about half the column, and
            uncropping as it arrives rather than fading in. */}
        <div className="mt-10 grid md:mt-14 md:grid-cols-12">
          <ScrollFrame
            enter={0.62}
            className={cn(
              "md:col-span-7",
              rightward ? "md:col-start-6" : "md:col-start-1",
            )}
          >
            <figure
              className={cn(
                "wipe-up rise-plate relative overflow-hidden",
                /* Landscape captures take the column; a handset takes only
                   the width of a handset. The old version put a tinted plate
                   behind the portrait screens to fill the column out, which
                   is a card with the word card removed — so there is no
                   plate, and a phone is simply a narrow object with a lot of
                   page around it. */
                wide ? "w-full" : "w-fit",
              )}
              style={{ borderRadius: "var(--radius-hair)" }}
            >
              <div
                className={cn("relative overflow-hidden", wide ? "h-[32svh] md:h-[42svh]" : "h-[38svh] md:h-[46svh]")}
                style={
                  wide
                    ? { width: "100%" }
                    : { aspectRatio: `${screen.image.width} / ${screen.image.height}` }
                }
              >
                <Image
                  src={screen.image}
                  alt={t(screen.caption, locale)}
                  placeholder="blur"
                  priority={priority}
                  fill
                  sizes={
                    wide
                      ? "(min-width: 768px) 52vw, 88vw"
                      : "(min-width: 768px) 18vw, 46vw"
                  }
                  className={cn(
                    "object-cover transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] md:group-hover/unit:scale-[1.02]",
                    wide && "object-top",
                  )}
                />
              </div>
            </figure>
          </ScrollFrame>
        </div>

        {/* 03 — the name, 04 — the line under it, and the one mark that says
            it opens. Set against the opposite margin from the picture, which
            is what makes the two read as one spread. */}
        <div className="mt-10 grid md:mt-12 md:grid-cols-12">
          <ScrollFrame
            enter={0.5}
            className={cn(
              "md:col-span-6",
              rightward ? "md:col-start-6" : "md:col-start-1",
            )}
          >
            <div className="rise-copy">
              <h3 id={`project-${project.slug}`} className="text-project">
                {project.name}
              </h3>

              <p className="mt-4 max-w-[44ch] text-[var(--fg-mute)]">
                {t(project.summary, locale)}
              </p>

              {/* The only mark that says it opens. It is a line with an
                  arrow on the end, the same one every other link on this
                  site has — a project does not need a bigger affordance
                  than a paragraph does. */}
              <span className="mono-label mt-8 inline-flex items-center gap-4 text-[var(--fg-dim)]">
                {copy.work.open}
                <span
                  aria-hidden="true"
                  className="relative block h-px w-10 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/unit:w-20"
                >
                  <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
                </span>
              </span>
            </div>
          </ScrollFrame>
        </div>
      </Link>
    </article>
  );
}
