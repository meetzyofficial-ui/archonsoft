import type { ReactNode } from "react";

/**
 * The masthead every top-level route opens with.
 *
 * A rule, the page's name at ten pixels on it, then one sentence in the
 * display serif and a standfirst in the far column. It is deliberately half
 * the height of the old one: that version reserved a screen and a half for a
 * title before any content began, on six routes, and the largest thing on
 * every inner page was the word naming it.
 *
 * Nothing here animates. This block is the first screen of every inner route,
 * so a reveal on it is a reveal nobody sees — and one that is paid for: an
 * element that is still settling cannot be the largest contentful paint until
 * it stops, which on a throttled connection dated a masthead painted at 0.85s
 * to 3.6s. The page opens still; motion starts when you scroll.
 */
export function PageHeader({
  title,
  lead,
  accent,
  standfirst,
  children,
}: {
  title: string;
  aside?: string;
  lead: string;
  accent: string;
  standfirst: string;
  children?: ReactNode;
}) {
  return (
    <section data-scheme="black" className="bg-[var(--color-black)] pt-[var(--header-h)] text-[var(--fg)]">
      <div className="frame grid gap-8 py-14 md:grid-cols-12 md:items-end md:py-24">
        <h1 className="text-display max-w-[16ch] md:col-span-8" aria-label={`${title}: ${lead} ${accent}`}>
          {lead} <span className="text-[var(--color-orange)]">{accent}</span>
        </h1>
        <div className="md:col-span-4">
          <p className="text-lead text-[var(--fg-dim)]">{standfirst}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
