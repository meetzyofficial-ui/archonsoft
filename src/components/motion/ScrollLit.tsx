"use client";

import { Fragment, useEffect, useRef, type CSSProperties, type ElementType } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { clamp, cn } from "@/lib/utils";
import type { Segment } from "@/components/motion/SplitReveal";

type ScrollLitProps = {
  text: string | Segment[];
  as?: ElementType;
  className?: string;
  /** Opacity of a word that has not been reached yet. */
  floor?: number;
};

/**
 * Type that lights word by word as the block passes the middle of the screen.
 *
 * Scroll writes a single custom property on the container; every word derives
 * its own opacity from that number with a clamp, so one style write per frame
 * drives the whole paragraph and React never re-renders. Under reduced motion
 * the property is pinned at 1 and the text simply reads as set.
 */
export function ScrollLit({ text, as: Tag = "p", className, floor = 0.2 }: ScrollLitProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const segments: Segment[] = typeof text === "string" ? [{ text }] : text;
  const words = segments.flatMap((segment) =>
    segment.text
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, serif: segment.serif, accent: segment.accent })),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.style.setProperty("--p", "1");
      return;
    }

    let frame = 0;
    let active = false;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      const span = rect.height + viewport * 0.32;
      const progress = (viewport * 0.82 - rect.top) / span;
      node.style.setProperty("--p", String(clamp(progress, 0, 1)));
    };

    const onScroll = () => {
      if (!active || frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        active = entries[0]?.isIntersecting ?? false;
        if (active) update();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const containerStyle = {
    "--n": words.length,
    "--floor": floor,
    "--p": 0,
  } as CSSProperties;

  return (
    <Tag ref={ref} className={className} style={containerStyle}>
      {words.map((item, index) => (
        <Fragment key={`${item.word}-${index}`}>
          <span
            className={cn(
              "inline-block",
              item.serif && "serif-accent",
              item.accent && "text-[var(--accent)]",
            )}
            style={
              {
                "--i": index,
                opacity: "clamp(var(--floor), calc((var(--p) * var(--n)) - var(--i)), 1)",
              } as CSSProperties
            }
          >
            {item.word}
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
