"use client";

import { useState } from "react";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { DOMAINS } from "@/data/labs";
import { DOMAIN_FACETS } from "@/data/collection";
import type { Copy } from "@/i18n/dictionary";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * What the studio builds.
 *
 * Rows on rules, not tiles in a grid. No icons, no rounded boxes, no
 * three-by-three of the same card with a different noun in it — a capability
 * list is the easiest place on a studio website to write something that
 * cannot be checked, and a grid of identical boxes is what makes that easy to
 * skim past.
 *
 * So each row carries its own evidence: the number of pieces on this site that
 * actually belong to that discipline, printed beside its name. A discipline
 * with nothing behind it says so in the same breath as its own name.
 *
 * A row opens; it never navigates. Every row used to be a link to the
 * projects archive, so a visitor reading "Systems" or "Commerce" was thrown
 * off the home page by a click they meant as "tell me more". Now a pointer
 * that can hover opens a row by hovering, and a click or a tap toggles it —
 * the second sentence, the one that says how the discipline is practised, is
 * what the row is for. The light lifting under the open row is the section's
 * whole interaction language; the projects are one section further down.
 */
export function Capabilities({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [open, setOpen] = useState<string | null>(null);
  const counts = new Map(DOMAIN_FACETS.map((facet) => [facet.id, facet.count]));

  return (
    <section
      id="capabilities"
      data-scheme="paper"
      data-band="paper"
      className="relative py-28 md:py-40"
    >
      <div className="frame">
        <ScrollFrame enter={0.45}>
          <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.register.label}
            </span>
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.register.aside}
            </span>
          </div>
          <h2 className="text-section rise-copy mt-8 max-w-[15ch] md:mt-10">
            {copy.register.statement}
          </h2>
        </ScrollFrame>

        <ul className="mt-20 md:mt-28">
          {DOMAINS.map((domain, i) => {
            const count = counts.get(domain.id) ?? 0;
            const isOpen = open === domain.id;
            return (
              <li
                key={domain.id}
                onMouseEnter={() => setOpen(domain.id)}
                onMouseLeave={() => setOpen(null)}
                className="hairline-t group/row relative isolate"
              >
                {/* The light under the row. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-x-[-2rem] inset-y-0 -z-10 transition-opacity duration-[900ms] ease-[var(--ease-out-soft)]",
                    isOpen ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    background:
                      "linear-gradient(90deg, color-mix(in oklab, var(--color-cyan) 9%, transparent), transparent 72%)",
                  }}
                />
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`capability-${domain.id}`}
                  onClick={() => {
                    /* With hover the row is already open under the pointer, so
                       a click keeps it open; on touch a tap toggles it. */
                    const hover = window.matchMedia("(hover: hover)").matches;
                    setOpen(isOpen && !hover ? null : domain.id);
                  }}
                  className="block w-full cursor-pointer py-6 text-left md:py-7"
                >
                  <span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <span
                      className="mono-micro w-7 shrink-0 text-[var(--fg-mute)]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span
                      role="heading"
                      aria-level={3}
                      className="text-sub flex-1 transition-transform duration-[800ms] ease-[var(--ease-out-expo)] md:group-hover/row:translate-x-2.5"
                    >
                      {t(domain.title, locale)}
                    </span>

                    <span className="mono-micro shrink-0 text-[var(--fg-mute)]">
                      {count > 0
                        ? `${String(count).padStart(2, "0")} ${copy.register.pieces}`
                        : copy.register.none}
                    </span>
                  </span>

                  <span
                    id={`capability-${domain.id}`}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-[700ms] ease-[var(--ease-out-expo)]",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="block overflow-hidden">
                      <span className="grid gap-6 pt-5 md:grid-cols-12 md:pl-[calc(1.75rem+2rem)]">
                        <span className="text-quote block max-w-[34ch] md:col-span-5">
                          {t(domain.precis, locale)}
                        </span>
                        <span className="block max-w-[50ch] text-[var(--fg-mute)] md:col-span-6 md:col-start-7">
                          {t(domain.detail, locale)}
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
