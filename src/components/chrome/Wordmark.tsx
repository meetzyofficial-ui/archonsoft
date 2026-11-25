import { cn } from "@/lib/utils";

/**
 * The Archon Soft mark.
 *
 * This is the supplied logo and nothing else. The symbol is three left-aligned
 * bars of decreasing width — measured off `arcsoft logo.png` rather than
 * redrawn from memory: bar height 7.4 units on an 11-unit pitch, widths 34,
 * 24.5 and 15, which is a constant 9.5-unit step. The wordmark is ARCHON set
 * against a lighter SOFT, exactly as the supplied file sets it.
 *
 * What used to be here was an arch with a gradient keystone, which is not the
 * Archon logo — it was invented for the old site, and the whole brand asset
 * folder still carries it. The mark is the one thing this rebuild was told to
 * preserve, so it is now the real one, in a single flat ink, with no gradient
 * and no shadow; the shortest bar takes the brand orange. Only the colour changes with the scheme
 * it sits on; the geometry never does.
 */

export function ArchonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 29.4"
      aria-hidden="true"
      className={cn("h-[1em] w-auto", className)}
      style={{ aspectRatio: "34 / 29.4" }}
    >
      <rect x="0" y="0" width="34" height="7.4" fill="currentColor" />
      <rect x="0" y="11" width="24.5" height="7.4" fill="currentColor" />
      <rect x="0" y="22" width="15" height="7.4" fill="var(--color-orange)" />
    </svg>
  );
}

export function Wordmark({
  className,
}: {
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ArchonIcon className="h-[0.92em]" />
      <span className="sr-only">Archon Soft</span>
      <span
        aria-hidden="true"
        className="text-[0.82em] leading-none font-extrabold tracking-[-0.01em] uppercase [font-stretch:115%]"
      >
        Archon
        <span className="font-normal text-[var(--color-steel)] max-[359px]:hidden">soft</span>
      </span>
    </span>
  );
}
