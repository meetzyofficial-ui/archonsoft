"use client";

import type { ElementType, ReactNode } from "react";
import { useInView } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /**
   * Which CSS primitive to apply. `none` only sets the data attribute, so
   * children can opt in individually with `reveal-fade` / `reveal-clip`.
   * `rise` never leaves the paint, so use it for anything that could be the
   * largest contentful paint - opacity would tie that metric to hydration.
   */
  variant?: "fade" | "rise" | "clip" | "none";
  as?: ElementType;
  className?: string;
  /** Milliseconds. Applied as a transition-delay on the animated element. */
  delay?: number;
  threshold?: number;
  rootMargin?: string;
};

/**
 * Scroll-reveal wrapper. It only flips `data-revealed`; the transition itself
 * is declared in CSS, which keeps it off the JS thread and lets the
 * reduced-motion media query neutralise every reveal on the site at once.
 *
 * The clip variant deliberately puts `reveal-clip` on a child rather than on
 * the observed element: a clip-path is included when the browser computes an
 * intersection rect, so an element clipped to zero height can never satisfy
 * its own threshold and would stay hidden forever.
 */
export function Reveal({
  children,
  variant = "fade",
  as: Tag = "div",
  className,
  delay = 0,
  threshold,
  rootMargin,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, rootMargin });
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;

  if (variant === "clip") {
    return (
      <Tag ref={ref} data-revealed={inView ? "true" : "false"} className={className}>
        <div className="reveal-clip" style={style}>
          {children}
        </div>
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      data-revealed={inView ? "true" : "false"}
      className={cn(
        variant === "fade" && "reveal-fade",
        variant === "rise" && "reveal-rise",
        className,
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}
