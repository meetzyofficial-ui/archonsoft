"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Provenance, ProvenanceText } from "@/components/ui/Provenance";
import { MATRIX } from "@/data/matrix";
import { getDomain } from "@/data/labs";
import type { Copy } from "@/i18n/dictionary";
import { useHasPointer } from "@/lib/hooks";
import { localePath, t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * What are you building?
 *
 * This is the closest thing on the site to a sales conversation, and it is
 * built the way that conversation actually goes: someone says one sentence
 * about their situation, and the useful reply is not a brochure but "that is
 * this kind of system, it needs these parts, and here is the nearest thing I
 * have already built."
 *
 * The last line is the one that matters, so it is the one that carries a
 * link, and it never blurs a shipped product into a concept.
 */
export function SelfSelect({ locale, copy }: { locale: Locale; copy: Copy }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const hasPointer = useHasPointer();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const row = MATRIX[active]!;
  const domain = getDomain(row.domain);
  const href =
    row.proof.kind === "shipped"
      ? localePath(locale, `/work/${row.proof.slug}`)
      : localePath(locale, `/labs/${row.proof.slug}`);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = MATRIX.length - 1;
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
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <div
        role="tablist"
        aria-label={copy.select.label}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="hairline-t lg:col-span-6"
      >
        {MATRIX.map((option, index) => {
          const selected = index === active;
          return (
            <button
              key={option.id}
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
              <span className="flex items-baseline gap-4 py-4 md:gap-7 md:py-5">
                <span
                  className={cn(
                    "mono-label transition-colors duration-500",
                    selected ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "display text-d3 transition-[color,transform] duration-[600ms] ease-[var(--ease-out-expo)]",
                    selected
                      ? "translate-x-1.5 text-[var(--fg)]"
                      : "text-[var(--fg-mute)] group-hover/row:text-[var(--fg-dim)]",
                  )}
                >
                  {t(option.intent, locale)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mb-[0.3em] h-px shrink-0 self-end bg-[var(--accent)] transition-[width] duration-[700ms] ease-[var(--ease-out-expo)]",
                    selected ? "w-8 md:w-16" : "w-0",
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
          <dl>
            <div className="hairline-t py-4">
              <dt className="mono-label text-[var(--fg-mute)]">{copy.select.problem}</dt>
              <dd className="mt-2 text-lead">{t(row.problem, locale)}</dd>
            </div>

            <div className="hairline-t py-4">
              <dt className="mono-label text-[var(--fg-mute)]">{copy.select.product}</dt>
              <dd className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="display text-[1.375rem] tracking-[-0.02em]">
                  {t(row.productType, locale)}
                </span>
                {domain ? (
                  <span className="mono-label text-[var(--accent)]">{t(domain.title, locale)}</span>
                ) : null}
              </dd>
            </div>

            <div className="hairline-t py-4">
              <dt className="mono-label text-[var(--fg-mute)]">{copy.select.system}</dt>
              <dd className="mt-2 flex flex-wrap gap-x-2 gap-y-2">
                {tl(row.system, locale).map((part) => (
                  <span
                    key={part}
                    className="mono-label border border-[var(--line)] px-2.5 py-1.5 text-[var(--fg-dim)]"
                  >
                    {part}
                  </span>
                ))}
              </dd>
            </div>

            <div className="hairline-t hairline-b py-4">
              <dt className="mono-label text-[var(--fg-mute)]">{copy.select.proof}</dt>
              <dd className="mt-2">
                <Link
                  href={href}
                  className="group/proof block"
                  data-cursor-label={copy.select.open}
                >
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="display text-d3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/proof:translate-x-1.5">
                      {row.proof.name}
                    </span>
                    <Provenance kind={row.proof.kind} copy={copy} />
                  </span>
                  <span className="mt-2 block max-w-[46ch] text-[var(--fg-dim)]">
                    {t(row.proof.note, locale)}
                  </span>
                  <span className="mono-label link-rule mt-4 inline-flex items-center gap-3 text-[var(--fg)]">
                    {copy.select.open}
                    <span aria-hidden="true" className="block h-px w-8 bg-current" />
                  </span>
                </Link>

                {row.also && row.also.length > 0 ? (
                  <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="mono-label text-[var(--fg-mute)]">{copy.select.also}</span>
                    {row.also.map((other) => (
                      <Link
                        key={`${other.kind}-${other.slug}`}
                        href={localePath(
                          locale,
                          other.kind === "shipped"
                            ? `/work/${other.slug}`
                            : `/labs/${other.slug}`,
                        )}
                        className="mono-label link-rule inline-flex items-center gap-2 border border-[var(--line)] px-2.5 py-1.5 text-[var(--fg-dim)] hover:text-[var(--fg)]"
                      >
                        {other.name}
                        <ProvenanceText kind={other.kind} copy={copy} className="opacity-70" />
                      </Link>
                    ))}
                  </p>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
