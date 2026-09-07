import { cn } from "@/lib/utils";

/**
 * The real Archon Soft mark, from the supplied brand kit.
 *
 * The icon is an arch — a gateway — with an illuminated keystone at its apex.
 * The arch takes `currentColor` so it inverts with the surrounding scheme; the
 * keystone keeps the brand's blue-to-violet gradient, which the brand book
 * reserves for exactly this element and which nothing else on the site uses.
 *
 * The wordmark is set live in Space Grotesk rather than shipped as path data:
 * the brand book specifies that face for it, the site already loads it, and
 * live text scales, recolours and reads to a screen reader for free.
 */

export function ArchonIcon({
  className,
  /** Gradients need unique ids when more than one mark is on a page. */
  id = "archon-keystone",
}: {
  className?: string;
  id?: string;
}) {
  return (
    <svg viewBox="8 12 84 84" aria-hidden="true" className={cn("h-[1.05em] w-[1.05em]", className)}>
      <defs>
        <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--color-blue)" />
          <stop offset="1" stopColor="var(--color-violet)" />
        </linearGradient>
      </defs>
      <path
        d="M16 86 L16 44 L34 20 L66 20 L84 44 L84 86 L68 86 L68 48 L58 34 L42 34 L32 48 L32 86 Z"
        fill="currentColor"
      />
      <path d="M40 20 L60 20 L55 34 L45 34 Z" fill={`url(#${id})`} />
    </svg>
  );
}

export function Wordmark({
  className,
  compact = false,
  iconId,
}: {
  className?: string;
  /** Drops "soft" so the header mark can tighten as the page scrolls. */
  compact?: boolean;
  iconId?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ArchonIcon id={iconId} className="h-[1.35em] w-[1.35em]" />
      <span className="sr-only">Archon Soft</span>
      <span
        aria-hidden="true"
        className="display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.03em]"
      >
        Archon
        <span
          className={cn(
            "inline-block overflow-hidden align-bottom transition-[max-width,opacity] duration-[600ms] ease-[var(--ease-out-expo)]",
            compact ? "max-w-0 opacity-0" : "max-w-[5ch] opacity-100",
          )}
        >
          soft
        </span>
      </span>
    </span>
  );
}
