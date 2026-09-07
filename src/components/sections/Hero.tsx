"use client";

import { Clock } from "@/components/chrome/Clock";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ExplodedScreen } from "@/components/product/ExplodedScreen";
import { ActionLink } from "@/components/ui/Action";
import { Provenance } from "@/components/ui/Provenance";
import type { Copy } from "@/i18n/dictionary";
import { useEntered } from "@/lib/entrance";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The opening.
 *
 * The first thing on the page is not a headline over a decorative graphic —
 * it is a real screen from a live product, assembling itself. Within a couple
 * of seconds a visitor has seen an actual interface, the claim that Archon
 * builds the whole product, and the evidence sitting right next to the claim.
 *
 * The sequence is a set of CSS transitions gated by one `data-revealed` on the
 * section, so with scripting off the same markup renders fully composed, and
 * reduced motion neutralises the timing without losing anything.
 */
export function Hero({
  locale,
  copy,
  screen,
}: {
  locale: Locale;
  copy: Copy;
  screen: { src: string; width: number; height: number; alt: string };
}) {
  const entered = useEntered();

  return (
    <section
      data-hero=""
      data-scheme="dark"
      data-band="dark"
      data-revealed={entered ? "true" : "false"}
      aria-labelledby="hero-heading"
      className="scheme-surface relative flex min-h-[100svh] flex-col overflow-hidden pt-[72px]"
    >
      {/* Readout */}
      <div className="frame relative z-20 pt-6">
        <div
          className="hairline-t reveal-fade flex flex-wrap items-center justify-between gap-x-8 gap-y-1 pt-3"
          style={{ transitionDelay: "60ms" }}
        >
          <span className="mono-label text-[var(--fg)]">
            Archon <span className="text-[var(--accent)]">/</span> {copy.hero.studio}
          </span>
          <span className="mono-label hidden text-[var(--fg-mute)] sm:block">
            {copy.hero.location}
          </span>
          <Clock className="mono-label hidden tabular-nums text-[var(--fg-mute)] sm:block" />
        </div>
      </div>

      {/* Statement and the assembling product */}
      <div className="frame relative z-20 flex flex-1 items-center py-6 md:py-9">
        <div className="grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 id="hero-heading" className="text-mega">
              <SplitReveal
                text={copy.hero.lead}
                immediate={entered}
                lineHeight="0.86em"
                stagger={40}
                delay={140}
                as="span"
              />
              <SplitReveal
                text={[{ text: copy.hero.leadAccent }]}
                immediate={entered}
                lineHeight="0.86em"
                stagger={40}
                delay={260}
                as="span"
              />
            </h1>

            <div
              className="reveal-rise mt-7 flex flex-col gap-6"
              style={{ transitionDelay: "420ms" }}
            >
              <p className="max-w-[58ch] text-lead text-[var(--fg-dim)]">
                {copy.hero.standfirst}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ActionLink href={localePath(locale, "/work")} variant="solid">
                  {copy.hero.ctaWork}
                </ActionLink>
                <ActionLink href={localePath(locale, "/contact")} variant="line">
                  {copy.hero.ctaContact}
                </ActionLink>
              </div>
            </div>
          </div>

          {/* The signature: a live product screen, assembling. */}
          <div className="relative mx-auto w-[min(70vw,300px)] lg:col-span-4 lg:col-start-9 lg:w-full lg:max-w-[320px]">
            <div
              className="reveal-fade mb-3"
              style={{ transitionDelay: "1400ms" }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Provenance kind="shipped" copy={copy} />
                <span className="display text-[1.125rem] tracking-[-0.02em]">Meetzy</span>
              </div>
              <p className="mono-label mt-2.5 text-[var(--fg-mute)]">{copy.hero.proofFacts}</p>
            </div>

            <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line-strong)] bg-[var(--bg-raise)] p-[3px]">
              <ExplodedScreen
                src={screen.src}
                width={screen.width}
                height={screen.height}
                alt={screen.alt}
                bands={5}
                trigger="enter"
                delay={520}
                readouts={["UI / 01", "UI / 02", "UI / 03", "UI / 04"]}
                className="overflow-hidden rounded-[1.42rem]"
              />
            </div>

          </div>
        </div>
      </div>

      {/* The span, indexed into the grid */}
      <div className="frame relative z-20">
        <ul className="hairline-t hairline-b grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {copy.hero.disciplines.map((discipline, index) => (
            <li
              key={discipline}
              className="reveal-fade flex items-baseline gap-2 border-l border-[var(--line)] py-3 pl-3 first:border-l-0 md:pl-4"
              style={{ transitionDelay: `${420 + index * 45}ms` }}
            >
              <span className="mono-label text-[var(--accent)]">{`0${index + 1}`}</span>
              <span className="mono-label truncate text-[var(--fg-dim)]">{discipline}</span>
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
}
