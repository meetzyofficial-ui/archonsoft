import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/labs/Icon";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import type { Piece } from "@/data/collection";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One piece of work in the archive.
 *
 * The same unit as the home page, at reading distance: a hairline carrying the
 * index and the discipline at ten pixels, the picture offset into the grid,
 * then the name, one line, and an arrow. A visitor moving from the home page
 * to here should recognise the object immediately — it is the same object,
 * seen from further away, so the picture is a third of the viewport rather
 * than a half and the name drops a step in the scale.
 *
 * Concepts get the identical structure with the picture withheld, because
 * there is no picture: they are interfaces that run, not products that were
 * photographed. What sits in its place is the mark and the layers the concept
 * demonstrates, and the row says ARCHON LABS before it says anything else.
 * Blurring that line is the one thing this archive cannot do.
 */
export function WorkRow({
  piece,
  locale,
  copy,
  priority = false,
}: {
  piece: Piece;
  locale: Locale;
  copy: Copy;
  /** Set on the first row: its picture is the page's largest paint. */
  priority?: boolean;
}) {
  const shipped = piece.provenance === "shipped";
  const screen = piece.screens[0];
  const wide = Boolean(screen && screen.image.width > screen.image.height);

  return (
    <article
      className="group/row"
      data-provenance={piece.provenance}
    >
      <Link
        href={localePath(locale, piece.path)}
        data-cursor-label={shipped ? copy.work.read : copy.work.openConcept}
        className="frame block py-12 md:py-16"
      >
        {/* 01 — the rule and the record on it. */}
        <ScrollFrame enter={0.4}>
          <div className="hairline-t mono-micro rise-copy flex flex-wrap items-center gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]">
            <span
              className={shipped ? "text-[var(--accent)]" : undefined}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {piece.index}
            </span>
            <span>{t(piece.sector, locale)}</span>
            <span className="sm:ml-auto">
              {shipped ? copy.provenance.shipped : copy.provenance.concept}
            </span>
          </div>
        </ScrollFrame>

        <div className="mt-8 grid gap-y-8 md:mt-10 md:grid-cols-12 md:gap-x-8">
          {/* 02 — the picture, where there is one. Half the width it has on
              the home page, because a list is read and a page is looked at. */}
          {shipped && screen ? (
            <ScrollFrame enter={0.6} className="md:order-2 md:col-span-6">
              <figure
                className={cn(
                  "wipe-up rise-plate relative overflow-hidden",
                  wide ? "w-full" : "w-fit",
                )}
                style={{ borderRadius: "var(--radius-hair)" }}
              >
                <div
                  className={cn(
                    "relative overflow-hidden",
                    wide ? "h-[26svh] md:h-[32svh]" : "h-[34svh] md:h-[40svh]",
                  )}
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
                    sizes={wide ? "(min-width: 768px) 44vw, 88vw" : "(min-width: 768px) 14vw, 40vw"}
                    className={cn(
                      "object-cover transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] md:group-hover/row:scale-[1.02]",
                      wide && "object-top",
                    )}
                  />
                </div>
              </figure>
            </ScrollFrame>
          ) : null}

          {/* 03 — the name, 04 — the line, and what it is made of. */}
          <ScrollFrame
            enter={0.5}
            className={cn("md:order-1", shipped && screen ? "md:col-span-5" : "md:col-span-8")}
          >
            <div className="rise-copy">
              <h2
                className={cn(
                  "transition-transform duration-[900ms] ease-[var(--ease-out-expo)] md:group-hover/row:translate-x-2",
                  shipped ? "text-head" : "text-sub",
                )}
              >
                {piece.name}
              </h2>

              <p className="mt-3.5 max-w-[46ch] text-[var(--fg-mute)]">
                {t(piece.statement, locale)}
              </p>

              {shipped && piece.facts ? (
                <dl className="mono-micro mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[var(--fg-mute)]">
                  {piece.facts.slice(0, 4).map((fact) => (
                    <div key={fact.label.en} className="flex gap-2">
                      <dt>{t(fact.label, locale)}</dt>
                      <dd className="text-[var(--fg-dim)]">{t(fact.value, locale)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {!shipped ? (
                <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <ul className="mono-micro flex flex-wrap items-center gap-x-3 gap-y-2 text-[var(--fg-mute)]">
                    {piece.layers?.map((layer, i) => (
                      <li key={layer.en} className="flex items-center gap-3">
                        {i > 0 ? (
                          <span
                            aria-hidden="true"
                            className="block h-px w-3 bg-[var(--line-strong)]"
                          />
                        ) : null}
                        <span>{t(layer, locale)}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mono-micro flex items-center gap-3 text-[var(--fg-mute)]">
                    {piece.icon ? (
                      <span aria-hidden="true" className="text-[var(--fg-dim)]">
                        <Icon name={piece.icon} size={16} />
                      </span>
                    ) : null}
                    {copy.labs.running}
                  </span>
                </div>
              ) : null}

              <span className="mono-label mt-7 inline-flex items-center gap-4 text-[var(--fg-dim)]">
                {shipped ? copy.work.read : copy.work.openConcept}
                <span
                  aria-hidden="true"
                  className="relative block h-px w-10 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/row:w-20"
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
