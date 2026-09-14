"use client";

import Link from "next/link";
import { Clock } from "@/components/chrome/Clock";
import { SHOWCASE } from "@/data/showcase";
import { useEntered } from "@/lib/entrance";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The opening.
 *
 * One sentence, set as large as the page allows, in two tones: what the studio
 * does, and what that becomes. Under it the promise in one line and the two
 * things a visitor can do about it — look at the work, or start one. The right
 * of the screen is left to the mark hanging in the dark behind the page, which
 * is the only thing in the first viewport that moves on its own.
 *
 * The foot of the opening names the live products. Every one of them is a
 * link further down this page, so the first screen already says something
 * this site can prove.
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
          <span className="mono-micro hidden text-[var(--fg-mute)] sm:block">{copy.hero.location}</span>
          <Clock className="mono-micro hidden tabular-nums text-[var(--fg-mute)] sm:block" />
        </div>
      </div>

      <div className="frame relative z-10 flex flex-1 flex-col justify-center py-14 md:py-20">
        <h1 id="hero-heading" className="text-display max-w-[13ch] md:max-w-[15ch]">
          <span className="reveal-rise block" style={{ transitionDelay: "140ms" }}>
            {copy.hero.lead}
          </span>
          <span className="reveal-rise hero-accent block" style={{ transitionDelay: "240ms" }}>
            {copy.hero.leadAccent}
          </span>
        </h1>

        <div
          className="reveal-fade mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end"
          style={{ transitionDelay: "520ms" }}
        >
          <p className="text-lead max-w-[44ch] text-[var(--fg-dim)] md:col-span-6">{copy.hero.standfirst}</p>
          <div className="flex flex-wrap items-center gap-3 md:col-span-6 md:justify-end">
            <Link href={`${localePath(locale)}#projects`} className="btn-raised mono-label">
              {copy.hero.ctaWork}
              <span aria-hidden="true" className="arrow-rule" />
            </Link>
            <Link href={localePath(locale, "/contact")} className="btn-raised btn-ghost mono-label">
              {copy.hero.ctaContact}
            </Link>
          </div>
        </div>
      </div>

      <div className="frame relative z-10 pb-12 md:pb-14">
        <div
          className="reveal-fade hairline-t flex flex-wrap items-center justify-between gap-x-8 gap-y-3 pt-3"
          style={{ transitionDelay: "760ms" }}
        >
          <span className="mono-micro text-[var(--fg-mute)]">{copy.hero.scroll}</span>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-5">
            {SHOWCASE.map((project) => (
              <li key={project.slug}>
                <a
                  href={`#project-${project.slug}`}
                  className="mono-micro -my-3 inline-flex min-h-[44px] items-center gap-2 text-[var(--fg-mute)] transition-colors duration-300 hover:text-[var(--fg)]"
                >
                  <span aria-hidden="true" className="live-dot !h-[0.3rem] !w-[0.3rem]" />
                  {project.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
