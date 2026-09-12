import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * A chapter opening, reduced to a hairline.
 *
 * The old head printed an em dash in the accent colour, a title and an aside
 * at label size on every band, which turned every section on the site into the
 * same three-part announcement — and gave a number to things that were not a
 * sequence. What a chapter needs is a line across the page and two pieces of
 * ten-pixel metadata at either end of it. After that the type does the work.
 */
export function SectionRule({
  label,
  aside,
  className,
}: {
  label: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      variant="none"
      className={cn(
        "hairline-t mono-micro flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]",
        className,
      )}
    >
      <span className="reveal-fade">{label}</span>
      {aside ? (
        <span className="reveal-fade text-right" style={{ transitionDelay: "90ms" }}>
          {aside}
        </span>
      ) : null}
    </Reveal>
  );
}

/**
 * A section wrapper that owns vertical rhythm and the optional change of air.
 *
 * `paper` paints nothing — the atmosphere behind the document shows through
 * it, which is what makes the site read as one continuous field rather than a
 * stack of coloured blocks. `haze` thickens that air slightly. `ink` is night,
 * and is spent on the world entry and the close.
 */
export function Band({
  children,
  scheme,
  id,
  className,
  size = "regular",
  as: Tag = "section",
}: {
  children: ReactNode;
  scheme?: "paper" | "haze" | "ink";
  id?: string;
  className?: string;
  size?: "tight" | "regular" | "loose";
  as?: "section" | "div" | "footer" | "header";
}) {
  const padding = {
    tight: "py-16 md:py-24",
    regular: "py-24 md:py-36",
    loose: "py-32 md:py-44",
  }[size];

  return (
    <Tag
      id={id}
      data-scheme={scheme}
      data-band={scheme ?? "inherit"}
      className={cn(scheme === "haze" || scheme === "ink" ? "scheme-surface" : null, padding, className)}
    >
      {children}
    </Tag>
  );
}
