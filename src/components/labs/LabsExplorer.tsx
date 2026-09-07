"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/labs/Icon";
import { LabSurface } from "@/components/labs/LabSurface";
import { Provenance } from "@/components/ui/Provenance";
import { LABS } from "@/data/labs";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Ten concepts, one window.
 *
 * The obvious way to present ten prototypes is ten screenshots. This mounts
 * one at a time instead, so the page stays light and the visitor is doing
 * something rather than scrolling past something — and the moment they click a
 * second name and a completely different application appears in the same
 * frame, the point of the section has been made without a sentence of copy.
 *
 * There is one DOM order — name and promise, then the index, then the running
 * product — and grid placement moves the index into a column of its own on
 * wide screens. That ordering is the whole reason it works on a phone: a rail
 * sitting a screen away from the thing it changes is not a control.
 */
export function LabsExplorer({
  locale,
  copy,
  className,
}: {
  locale: Locale;
  copy: Copy;
  className?: string;
}) {
  const [slug, setSlug] = useState(LABS[0]!.slug);
  const lab = LABS.find((candidate) => candidate.slug === slug) ?? LABS[0]!;

  return (
    <div
      className={cn("grid gap-6 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0", className)}
      style={{ ["--accent" as string]: lab.accent }}
    >
      {/* What you are looking at, before you are given the controls for it. */}
      <div className="lg:col-span-9 lg:col-start-4 lg:row-start-1">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Provenance kind="concept" copy={copy} />
          <h3 className="display text-d3">{lab.name}</h3>
          <span className="mono-label text-[var(--accent)]">{t(lab.sector, locale)}</span>
          <span className="mono-label ml-auto flex items-center gap-2 text-[var(--fg-mute)]">
            <Icon name="play" size={11} />
            {copy.labs.running}
          </span>
        </div>

        {/* The customer problem first. The category is a label; this is the
            reason to keep reading. */}
        <p className="mt-5 max-w-[46ch] text-d3 text-[var(--fg)]">
          {t(lab.story.promise, locale)}
        </p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="mono-label text-[var(--fg-mute)]">{copy.story.capability}</span>
          <span className="text-[var(--fg-dim)]">{t(lab.story.capability, locale)}</span>
        </p>
      </div>

      {/* The index. A scrolling rail on narrow screens, a list beside the
          window on wide ones. */}
      <div className="lg:col-span-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <ul
          className={cn(
            "-mx-[var(--spacing-gutter)] flex snap-x gap-2 overflow-x-auto px-[var(--spacing-gutter)] pb-2",
            "lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0",
          )}
        >
          {LABS.map((candidate) => {
            const selected = candidate.slug === lab.slug;
            return (
              <li key={candidate.slug} className="shrink-0 snap-start lg:shrink">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSlug(candidate.slug)}
                  style={{ ["--accent" as string]: candidate.accent }}
                  className={cn(
                    "group/lab flex w-full cursor-pointer items-baseline gap-3 border-[var(--line)] px-3 py-2.5 text-left",
                    "transition-colors duration-300 lg:border-t lg:px-0 lg:py-3.5",
                    "border lg:border-x-0 lg:border-b-0",
                    selected
                      ? "border-[var(--accent)] lg:border-[var(--line)]"
                      : "hover:border-[var(--line-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "mono-label transition-colors duration-300",
                      selected ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                    )}
                  >
                    {candidate.index}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "display block text-[1.0625rem] leading-tight tracking-[-0.02em] transition-colors duration-300",
                        selected
                          ? "text-[var(--fg)]"
                          : "text-[var(--fg-mute)] group-hover/lab:text-[var(--fg-dim)]",
                      )}
                    >
                      {candidate.name}
                    </span>
                    <span className="mono-label mt-1 hidden truncate text-[var(--fg-mute)] lg:block">
                      {t(candidate.sector, locale)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ml-auto hidden size-1.5 shrink-0 self-center rounded-full bg-[var(--accent)] transition-opacity duration-300 lg:block",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The concept itself, directly under the rail that changes it. */}
      <div className="lg:col-span-9 lg:col-start-4 lg:row-start-2 lg:pt-6">
        {/* Keyed so a concept always mounts on its own first screen rather
            than inheriting whichever screen the last one was left on. */}
        <LabSurface key={lab.slug} lab={lab} locale={locale} copy={copy} />

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-[var(--fg-mute)]">
            {copy.labs.disclaimer}
          </p>
          <Link
            href={localePath(locale, `/labs/${lab.slug}`)}
            data-cursor-label={copy.labs.open}
            className="mono-label link-rule inline-flex shrink-0 items-center gap-3 text-[var(--fg)]"
          >
            {copy.labs.open}
            <span aria-hidden="true" className="block h-px w-8 bg-current" />
          </Link>
        </div>
      </div>
    </div>
  );
}
