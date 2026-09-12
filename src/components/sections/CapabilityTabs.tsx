"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Diagram } from "@/components/system/Diagram";
import { CAPABILITIES } from "@/data/capabilities";
import type { Copy } from "@/i18n/dictionary";
import { useHasPointer } from "@/lib/hooks";
import { t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The capabilities index.
 *
 * A tab set, not an accordion: the list stays whole while the panel beside it
 * changes. Four of the six stages are evidenced with a real screen from
 * shipped work rather than an illustration — the claim and its proof sit in
 * the same frame — and the two with no visible surface get a drawing instead.
 *
 * Pointer users get it on hover, everyone gets it on click, and the arrow keys
 * move between rows the way a tab list should.
 */
export function CapabilityTabs({ locale, copy }: { locale: Locale; copy: Copy }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const hasPointer = useHasPointer();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const current = CAPABILITIES[active]!;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = CAPABILITIES.length - 1;
    let next = active;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <div id="capabilities-tabs" className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <div
        role="tablist"
        aria-label={copy.capabilities.label}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="hairline-t lg:col-span-6"
      >
        {CAPABILITIES.map((capability, index) => {
          const selected = index === active;
          return (
            <button
              key={capability.index}
              ref={(node) => {
                tabsRef.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onFocus={() => setActive(index)}
              onMouseEnter={hasPointer ? () => setActive(index) : undefined}
              className="hairline-b group/row block w-full cursor-pointer text-left"
            >
              <span className="flex items-baseline gap-5 py-5 md:gap-8 md:py-7">
                <span
                  className={cn(
                    "mono-label transition-colors duration-500",
                    selected ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                  )}
                >
                  {capability.index}
                </span>
                <span
                  className={cn(
                    "display text-sub transition-[color,transform] duration-[600ms] ease-[var(--ease-out-expo)]",
                    selected
                      ? "translate-x-1.5 text-[var(--fg)]"
                      : "text-[var(--fg-mute)] group-hover/row:text-[var(--fg-dim)]",
                  )}
                >
                  {t(capability.title, locale)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mb-[0.28em] h-px shrink-0 self-end bg-[var(--accent)] transition-[width] duration-[700ms] ease-[var(--ease-out-expo)]",
                    selected ? "w-10 md:w-20" : "w-0",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${active}`}
        tabIndex={0}
        className="lg:col-span-5 lg:col-start-8"
      >
        <div className="lg:sticky lg:top-28">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--bg-raise)]">
            {CAPABILITIES.map((capability, index) => (
              <div
                key={capability.index}
                aria-hidden={index !== active}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[600ms] ease-[var(--ease-out-expo)]",
                  index === active ? "opacity-100" : "opacity-0",
                )}
              >
                {capability.evidence ? (
                  <div className="flex h-full items-center justify-center overflow-hidden py-3">
                    <Image
                      src={capability.evidence.screen.image}
                      alt={t(capability.evidence.screen.caption, locale)}
                      placeholder="blur"
                      sizes="(min-width: 1024px) 260px, 60vw"
                      className="h-full w-auto rounded-[1.1rem] border border-[var(--line)] object-contain"
                    />
                  </div>
                ) : (
                  <Diagram
                    kind={capability.diagram}
                    label={`${copy.capabilities.figure} ${capability.index}`}
                    className="p-2"
                  />
                )}
              </div>
            ))}

            <span className="mono-label absolute left-3 top-3 text-[var(--fg-mute)]">
              {current.evidence
                ? current.evidence.project
                : `${copy.capabilities.figure} ${current.index}`}
            </span>
          </div>

          <p className="mt-6 text-lead">{t(current.precis, locale)}</p>
          <p className="mt-4 max-w-[46ch] text-[var(--fg-dim)]">{t(current.detail, locale)}</p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {tl(current.methods, locale).map((method) => (
              <li key={method} className="mono-label text-[var(--fg-mute)]">
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
