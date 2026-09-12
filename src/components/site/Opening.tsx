"use client";

import Link from "next/link";
import { Clock } from "@/components/chrome/Clock";
import { useEntered } from "@/lib/entrance";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The opening.
 *
 * Not a hero. There is no picture, no device, no pair of buttons, and the
 * studio's own name is not set at a sixth of the viewport — it is eleven
 * pixels tall, on the rule at the top, where a masthead belongs. What holds
 * the screen is one sentence in the display serif and the air around it.
 *
 * The composition is four things at four scales, and the gaps between them
 * are the design: a line of ten-pixel metadata across the top, the sentence,
 * the three disciplines set as small type against it, and a rule at the foot
 * carrying the scroll cue. Behind all of it the atmosphere drifts and the
 * form turns, which is the only thing in the first viewport that moves on its
 * own.
 *
 * Every word here is already true elsewhere on the site: the positioning trio
 * is the same three claims the work index can evidence — three shipped
 * products, a world that runs in a browser, ten concept interfaces you can
 * open.
 */
export function Opening({ locale, copy }: { locale: Locale; copy: Copy }) {
  const entered = useEntered();

  return (
    <section
      data-hero
      data-revealed={entered ? "true" : "false"}
      data-scheme="paper"
      data-band="paper"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] flex-col pt-16"
    >
      <div className="frame relative z-10 pt-5">
        <div
          className="hairline-t reveal-fade flex items-center justify-between gap-x-8 pt-3"
          style={{ transitionDelay: "60ms" }}
        >
          <span className="mono-micro text-[var(--fg-dim)]">{copy.hero.studio}</span>
          <span className="mono-micro hidden text-[var(--fg-mute)] sm:block">
            {copy.hero.location}
          </span>
          <Clock className="mono-micro hidden tabular-nums text-[var(--fg-mute)] sm:block" />
        </div>
      </div>

      <div className="frame relative z-10 flex flex-1 flex-col justify-center py-16 md:py-24">
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-12 md:items-end">
          <h1 id="hero-heading" className="text-display md:col-span-8">
            {/* Two lines, set as two blocks so the second can arrive after
                the first without a per-character split — at this size, a
                letter-by-letter reveal is a party trick. */}
            <span className="reveal-rise block" style={{ transitionDelay: "140ms" }}>
              {copy.hero.lead}
            </span>
            <span
              className="reveal-rise block text-[var(--fg-mute)]"
              style={{ transitionDelay: "240ms" }}
            >
              {copy.hero.leadAccent}
            </span>
          </h1>

          {/* The three disciplines, set small and pushed to the far column —
              the opposite of the old page, where they were the largest thing
              on it. They are read second on purpose. */}
          <ul className="md:col-span-3 md:col-start-10">
            {copy.hero.positioning.map((line, i) => (
              <li
                key={line}
                className="hairline-t reveal-fade mono-label py-2.5 text-[var(--fg-mute)] first:border-t-0 first:pt-0"
                style={{ transitionDelay: `${420 + i * 80}ms` }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="reveal-fade mt-16 flex flex-wrap items-end justify-between gap-x-16 gap-y-6 md:mt-24"
          style={{ transitionDelay: "700ms" }}
        >
          <p className="text-lead max-w-[46ch] text-[var(--fg-dim)]">{copy.hero.standfirst}</p>
          <Link
            href={localePath(locale, "/work")}
            className="mono-label link-rule group inline-flex items-center gap-4 text-[var(--fg)]"
          >
            {copy.hero.ctaWork}
            <span
              aria-hidden="true"
              className="relative block h-px w-12 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:w-20"
            >
              <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
            </span>
          </Link>
        </div>
      </div>

      <div className="frame relative z-10 pb-16">
        <div
          className="reveal-fade hairline-t flex items-center justify-between pt-3"
          style={{ transitionDelay: "840ms" }}
        >
          <span className="mono-micro text-[var(--fg-mute)]">{copy.hero.scroll}</span>
          <span className="mono-micro text-[var(--fg-mute)]">{copy.work.indexAside}</span>
        </div>
      </div>
    </section>
  );
}
