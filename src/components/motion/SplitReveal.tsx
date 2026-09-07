"use client";

import { Fragment, type CSSProperties, type ElementType } from "react";
import { useInView } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export type Segment = {
  text: string;
  /** Sets the word in the italic serif accent face. */
  serif?: boolean;
  /** Colours the word with the current scheme accent. */
  accent?: boolean;
};

type SplitRevealProps = {
  /** Plain string, or segments when part of the phrase needs its own styling. */
  text: string | Segment[];
  as?: ElementType;
  className?: string;
  /** Milliseconds between consecutive words. */
  stagger?: number;
  /** Milliseconds before the first word. */
  delay?: number;
  /** Reveal on mount instead of on scroll - for above-the-fold type. */
  immediate?: boolean;
  /**
   * Mask height, as a length. Every word mask is forced to this exact height so
   * mixed faces and sizes share one baseline; pass the line-height of the type
   * step you are using. A unitless value would recompute per font-size and
   * break alignment, which is why this is a length.
   */
  lineHeight?: string;
  threshold?: number;
};

/**
 * Word-by-word mask reveal.
 *
 * Splitting on words rather than pre-baked lines means the effect survives
 * reflow at any viewport width. The animated spans are hidden from assistive
 * technology and the phrase is exposed once through aria-label, so a heading is
 * announced as a sentence rather than a stream of fragments.
 */
export function SplitReveal({
  text,
  as: Tag = "span",
  className,
  stagger = 26,
  delay = 0,
  immediate = false,
  lineHeight = "1em",
  threshold = 0.2,
}: SplitRevealProps) {
  const [ref, inView] = useInView<HTMLElement>({ threshold });
  const revealed = immediate || inView;

  const segments: Segment[] = typeof text === "string" ? [{ text }] : text;
  const label = segments.map((segment) => segment.text).join(" ");

  const words = segments.flatMap((segment) =>
    segment.text
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, serif: segment.serif, accent: segment.accent })),
  );

  const maskStyle: CSSProperties = {
    lineHeight,
    paddingBlock: "0.3em",
    marginBlock: "-0.3em",
  };

  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      aria-label={label}
      className={cn("block", className)}
    >
      <span aria-hidden="true">
        {words.map((item, index) => (
          <Fragment key={`${item.word}-${index}`}>
            <span className="inline-block overflow-hidden align-bottom" style={maskStyle}>
              <span
                className={cn(
                  "inline-block translate-y-[115%] opacity-0 will-change-transform",
                  "transition-[transform,opacity] duration-[1050ms] ease-[var(--ease-out-expo)]",
                  "motion-reduce:translate-y-0 motion-reduce:opacity-100",
                  "[.no-js_&]:translate-y-0 [.no-js_&]:opacity-100",
                  "[[data-revealed='true']_&]:translate-y-0 [[data-revealed='true']_&]:opacity-100",
                  item.serif && "serif-accent",
                  item.accent && "text-[var(--fg-dim)]",
                )}
                style={{ transitionDelay: `${delay + index * stagger}ms` }}
              >
                {item.word}
              </span>
            </span>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
