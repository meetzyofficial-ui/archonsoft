"use client";

import { Children, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The filter over the whole body of work.
 *
 * The rows themselves are rendered on the server and handed in as children —
 * they carry real images with blur placeholders and localised copy, and none
 * of that belongs in a client bundle. What is here is the only part that has
 * to be interactive: which of them are showing.
 *
 * Filtering is real. It narrows an actual list against actual tags, every
 * facet prints how many pieces it holds so nothing leads to an empty page by
 * surprise, and the two axes combine — because "the commerce work that
 * actually shipped" is a question somebody deciding whether to hire a studio
 * genuinely asks.
 */

export type IndexItem = {
  slug: string;
  provenance: "shipped" | "concept";
  domains: string[];
};

export type IndexFacet = { id: string; label: string; count: number };

export function WorkIndex({
  items,
  provenanceFacets,
  domainFacets,
  copy,
  children,
}: {
  items: IndexItem[];
  provenanceFacets: IndexFacet[];
  domainFacets: IndexFacet[];
  /* Plain strings only. A formatter is a function, and a function cannot
     cross the boundary into a client component — so the sentence is assembled
     here from the pieces the server localised. */
  copy: {
    all: string;
    provenance: string;
    domain: string;
    showing: string;
    ofTotal: string;
    pieces: string;
    empty: string;
    reset: string;
  };
  children: ReactNode;
}) {
  const [provenance, setProvenance] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const rows = useMemo(() => Children.toArray(children), [children]);

  const visible = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(
          ({ item }) =>
            (!provenance || item.provenance === provenance) &&
            (!domain || item.domains.includes(domain)),
        ),
    [domain, items, provenance],
  );

  /* A count that is live rather than one that is drawn: a filter which changes
     the page silently is a filter a screen reader user cannot use. */
  const pad = (n: number) => String(n).padStart(2, "0");
  const readout = `${copy.showing} ${pad(visible.length)} ${copy.ofTotal} ${pad(items.length)} ${copy.pieces}`;

  return (
    <div>
      {/* Opaque, clear of the header, and only sticky where there is room.
          It was translucent and the rows read straight through it, which does
          not look like a design decision — it looks like a bug. It has to
          start below the fixed header, or scrolling up brings the navigation
          down on top of it. And on a phone two rows of chips pinned under a
          64px header is a quarter of the screen permanently spent on chrome,
          so there it scrolls away with everything else. */}
      <div className="hairline-b hairline-t z-20 bg-[color-mix(in_oklab,var(--color-paper)_88%,transparent)] py-4 backdrop-blur-sm md:sticky md:top-16">
        {/* Scrolled, not wrapped.
            The chips are set in the mono face, and until it arrives they lay
            out in the fallback — wide enough that the domain row wrapped to an
            extra line and then unwrapped when the real font swapped in, taking
            the whole index up with it. That was 0.088 of layout shift, all of
            it after the rows were on screen.

            A reserved height cannot fix a row that changes how many lines it
            occupies, so the rows do not wrap at all: they scroll sideways in
            their own track, which is a single line whatever face is loaded.
            It is also the better control on a phone, where eight domains were
            three stacked lines of chrome above the work. */}
        <div className="flex flex-col gap-3">
          <div className="scroll-row flex items-center gap-x-6 overflow-x-auto px-[var(--spacing-gutter)]">
            <span className="mono-label shrink-0 text-[var(--fg-mute)]">{copy.provenance}</span>
            <Chip
              label={copy.all}
              count={items.length}
              active={provenance === null}
              onClick={() => setProvenance(null)}
            />
            {provenanceFacets.map((facet) => (
              <Chip
                key={facet.id}
                label={facet.label}
                count={facet.count}
                active={provenance === facet.id}
                onClick={() => setProvenance(provenance === facet.id ? null : facet.id)}
              />
            ))}
          </div>

          <div className="scroll-row flex items-center gap-x-6 overflow-x-auto px-[var(--spacing-gutter)]">
            <span className="mono-label shrink-0 text-[var(--fg-mute)]">{copy.domain}</span>
            <Chip
              label={copy.all}
              count={items.length}
              active={domain === null}
              onClick={() => setDomain(null)}
            />
            {domainFacets.map((facet) => (
              <Chip
                key={facet.id}
                label={facet.label}
                count={facet.count}
                active={domain === facet.id}
                onClick={() => setDomain(domain === facet.id ? null : facet.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="frame mono-label mt-6 text-[var(--fg-mute)]">
        {readout}
      </p>

      {visible.length === 0 ? (
        <div className="frame py-24">
          <p className="text-lead text-[var(--fg-dim)]">{copy.empty}</p>
          <button
            type="button"
            onClick={() => {
              setProvenance(null);
              setDomain(null);
            }}
            className="mono-label link-rule -my-2 mt-6 py-2 text-[var(--fg)]"
          >
            {copy.reset}
          </button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          {visible.map(({ index }) => (
            <div key={items[index]!.slug}>{rows[index]}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mono-label -my-2 inline-flex shrink-0 cursor-pointer items-baseline gap-2 py-2 whitespace-nowrap transition-colors duration-300",
        active ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg-dim)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block h-px transition-[width] duration-500 ease-[var(--ease-out-expo)]",
          active ? "w-6 bg-[var(--accent)]" : "w-0 bg-current",
        )}
      />
      {label}
      <span className="opacity-55" style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}
