"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * The one thing on this site that turns scrolling into movement.
 *
 * Everything editorial here — a photograph that grows as it arrives, a title
 * that drifts against the picture beside it, a caption that catches up late —
 * is the same measurement expressed differently, so it is measured once. The
 * element publishes its own travel through the viewport as a custom property
 * and the composition decides in CSS what that number means. No component
 * writes a transform in JavaScript, nothing animates a layout property, and a
 * page with a dozen of these has one loop rather than a dozen listeners.
 *
 * `--p` runs 0 → 1 as the element crosses the viewport: 0 when its top edge is
 * still a screen below the fold, 1 when its bottom edge has passed the top.
 * `--enter` is the first half of that, clamped — the useful one for anything
 * that should finish arriving and then hold still rather than keep moving all
 * the way out of frame.
 *
 * Two rules keep it cheap. Positions are read in one pass and written in the
 * next, so nothing interleaves reads and writes into a layout thrash; and an
 * element that is nowhere near the viewport is skipped entirely rather than
 * measured, which is what lets the home page carry as many of these as the
 * work needs.
 */

type Tracked = {
  el: HTMLElement;
  /** How much of the travel is spent arriving. The rest is spent leaving. */
  enter: number;
  last: number;
};

const tracked = new Set<Tracked>();
let frame = 0;

function measure() {
  frame = 0;
  const height = window.innerHeight;

  /* Read every position first. Writing a style between two reads is what
     makes a scroll handler cost a layout per element instead of one. */
  const reads: { item: Tracked; p: number }[] = [];
  for (const item of tracked) {
    const rect = item.el.getBoundingClientRect();
    /* Far enough away that no number it could publish would be visible. */
    if (rect.bottom < -height || rect.top > height * 2) {
      if (item.last !== -1) {
        reads.push({ item, p: rect.top > 0 ? 0 : 1 });
      }
      continue;
    }
    const span = rect.height + height;
    const travelled = span > 0 ? (height - rect.top) / span : 0;
    reads.push({ item, p: clamp(travelled) });
  }

  for (const { item, p } of reads) {
    /* Three decimal places is finer than a pixel on any of these, and it stops
       a sub-pixel jitter re-painting the whole composition every frame. */
    const value = Math.round(p * 1000) / 1000;
    if (value === item.last) continue;
    item.last = value;
    item.el.style.setProperty("--p", String(value));
    item.el.style.setProperty("--enter", String(clamp(value / item.enter)));
  }
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(measure);
}

function track(item: Tracked) {
  const first = tracked.size === 0;
  tracked.add(item);
  if (first) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  schedule();
  return () => {
    tracked.delete(item);
    if (tracked.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

export function ScrollFrame({
  children,
  className,
  style,
  /** Fraction of the crossing spent arriving. Lower finishes sooner. */
  enter = 0.55,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  enter?: number;
  as?: "div" | "section" | "figure" | "header";
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      /* Everything arrived. The composition reads the same properties, so a
         visitor who asked for no motion gets the finished picture rather than
         a page that never resolves. */
      el.style.setProperty("--p", "0.5");
      el.style.setProperty("--enter", "1");
      return;
    }
    return track({ el, enter, last: -1 });
  }, [enter, reduced]);

  return (
    <Tag
      id={id}
      ref={ref as React.Ref<never>}
      className={cn("scroll-frame", className)}
      style={style}
    >
      {children}
    </Tag>
  );
}
