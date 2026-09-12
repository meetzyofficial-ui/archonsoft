"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/labs/Icon";
import { LabSurface } from "@/components/labs/LabSurface";
import { Provenance } from "@/components/ui/Provenance";
import { CATEGORIES, CATEGORY_GROUPS } from "@/data/categories";
import { getLab } from "@/data/labs";
import type { Copy } from "@/i18n/dictionary";
import { useHasPointer } from "@/lib/hooks";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * What can we build — as a map rather than an icon grid.
 *
 * Thirteen categories in four clusters on the left, and on the right whatever
 * the chosen one actually resolves to: a real screen from a shipped product,
 * or the running prototype of a concept, opened on the screen that makes the
 * point. The badge says which before you look at it, every time.
 *
 * The category list is the visitor's vocabulary, not the studio's. Somebody
 * arrives saying "I need internal tools" and should not have to work out that
 * this is the same thing the site calls Systems.
 */
export function CapabilityMap({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [activeId, setActiveId] = useState(CATEGORIES[0]!.id);
  const hasPointer = useHasPointer();
  const active = CATEGORIES.find((one) => one.id === activeId) ?? CATEGORIES[0]!;
  const lab = active.kind === "concept" ? getLab(active.slug) : undefined;

  const href =
    active.kind === "shipped"
      ? localePath(locale, `/work/${active.slug}`)
      : localePath(locale, `/labs/${active.slug}`);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      {/* The map. */}
      <div className="lg:col-span-4">
        {CATEGORY_GROUPS.map((group) => {
          const items = CATEGORIES.filter((one) => one.group === group.id);
          return (
            <section key={group.id} className="mb-4 last:mb-0 lg:mb-7">
              <h3 className="mono-label hairline-b pb-2 text-[var(--fg-mute)]">
                {t(group.title, locale)}
              </h3>
              {/* Below the wide breakpoint a thirteen-item column would push
                  the panel a screen away, and the whole point of the map is
                  that choosing a word changes what you are looking at. So it
                  becomes a wrapped set of chips and the panel stays in view. */}
              <ul className="mt-2 flex flex-wrap gap-2 lg:mt-1 lg:block">
                {items.map((item) => {
                  const selected = item.id === active.id;
                  return (
                    <li key={item.id} className="lg:block">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setActiveId(item.id)}
                        onMouseEnter={hasPointer ? () => setActiveId(item.id) : undefined}
                        onFocus={() => setActiveId(item.id)}
                        className={cn(
                          "group/cat flex cursor-pointer items-baseline gap-2 rounded-full border px-2.5 py-1.5 text-left transition-colors duration-300",
                          "lg:w-full lg:gap-3 lg:rounded-none lg:border-0 lg:px-0 lg:py-2",
                          selected
                            ? "border-[var(--accent)] lg:border-0"
                            : "border-[var(--line)] lg:border-0",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-[0.6em] hidden h-px shrink-0 bg-current transition-[width] duration-500 ease-[var(--ease-out-expo)] lg:block",
                            selected ? "w-6 text-[var(--accent)]" : "w-2.5 text-[var(--fg-mute)]",
                          )}
                        />
                        <span
                          className={cn(
                            "display text-[0.875rem] tracking-[-0.02em] transition-colors duration-300 lg:text-[1.125rem] xl:text-[1.25rem]",
                            selected
                              ? "text-[var(--fg)]"
                              : "text-[var(--fg-mute)] group-hover/cat:text-[var(--fg-dim)]",
                          )}
                        >
                          {t(item.title, locale)}
                        </span>
                        {item.kind === "shipped" ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-[0.55em] block size-1.5 shrink-0 rounded-full transition-opacity duration-300 lg:ml-auto",
                              selected ? "bg-[var(--accent)]" : "bg-[var(--fg-mute)] opacity-50",
                            )}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* What it resolves to. */}
      <div className="lg:col-span-8">
        <div className="lg:sticky lg:top-24">
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Provenance kind={active.kind} copy={copy} />
            <span className="display text-quote">{active.name}</span>
            <Link
              href={href}
              className="mono-label link-rule ml-auto inline-flex items-center gap-3 text-[var(--fg)]"
            >
              {copy.categories.open}
              <span aria-hidden="true" className="block h-px w-8 bg-current" />
            </Link>
          </div>

          <p className="mb-6 max-w-[56ch] text-lead text-[var(--fg-dim)]">
            {t(active.precis, locale)}
          </p>

          {/* Keyed on the category so a concept always mounts fresh on the
              screen that makes its point. */}
          {active.kind === "concept" && lab ? (
            <LabSurface
              key={active.id}
              lab={lab}
              locale={locale}
              copy={copy}
              initialView={active.view}
            />
          ) : active.kind === "shipped" ? (
            <figure
              key={active.id}
              className="flex aspect-[16/11] items-center justify-center overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--bg-raise)] p-5 md:p-8"
            >
              <Image
                src={active.screen.image}
                alt={t(active.screen.caption, locale)}
                placeholder="blur"
                sizes="(min-width: 1024px) 300px, 60vw"
                className="h-full w-auto rounded-[1.4rem] border border-[var(--line)] object-contain"
              />
            </figure>
          ) : null}

          <p className="mono-label mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[var(--fg-mute)]">
            <Icon name={active.kind === "shipped" ? "check" : "play"} size={11} />
            {active.kind === "shipped" ? copy.provenance.shippedNote : copy.provenance.conceptNote}
          </p>
        </div>
      </div>
    </div>
  );
}
