"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useEntered } from "@/lib/entrance";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { clamp, cn } from "@/lib/utils";

/**
 * THE ASSEMBLY — Archon's signature.
 *
 * A real product screen is not presented as a finished picture. It arrives as
 * an exploded assembly: horizontal strata cut from the actual screenshot,
 * separated in space with dimension lines and readouts between them, then
 * drawn together into the working interface.
 *
 * The idea comes from the mark itself. Archon's logo is an arch built from
 * stacked stone that only stands once the keystone is set; the products are
 * the same argument in software. So the interaction is not decoration bolted
 * onto a screenshot — it is the brand's own metaphor, performed on real work.
 *
 * Mechanically it is deliberately cheap: every band paints the same decoded
 * bitmap through `background-position`, so one image serves all of them, and
 * the only thing scroll touches is a transform and an opacity written straight
 * to the element. No canvas, no WebGL, nothing that could not run on a phone.
 *
 * At rest — no JavaScript, or reduced motion — the bands sit at zero offset,
 * which is simply the screenshot.
 */

type Props = {
  /** Optimised URL, from `getImageProps` on the server. */
  src: string;
  /** Intrinsic size, so the frame can hold its aspect before the image loads. */
  width: number;
  height: number;
  alt: string;
  /** How many strata to cut. Five reads as a system; more reads as noise. */
  bands?: number;
  /** `enter` assembles once as the page opens; `scroll` tracks the scroll. */
  trigger?: "enter" | "scroll";
  /** Mono readouts drawn in the gaps, top to bottom. Optional. */
  readouts?: string[];
  className?: string;
  /** Extra delay before an `enter` assembly begins, in ms. */
  delay?: number;
};

/** Lateral offset per band, as a fraction of the frame width, when exploded. */
const SPREAD = [-0.34, 0.22, -0.16, 0.3, -0.24, 0.18];

export function ExplodedScreen({
  src,
  width,
  height,
  alt,
  bands = 5,
  trigger = "scroll",
  readouts,
  className,
  delay = 0,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const entered = useEntered();

  const strata = useMemo(
    () =>
      Array.from({ length: bands }, (_, i) => ({
        i,
        // Percentage position that shows stratum i through a band-height window.
        offset: bands === 1 ? 0 : (i / (bands - 1)) * 100,
        spread: SPREAD[i % SPREAD.length] as number,
      })),
    [bands],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (reduced) {
      host.style.setProperty("--assembly", "1");
      return;
    }

    if (trigger === "enter") {
      if (!entered) {
        host.style.setProperty("--assembly", "0");
        return;
      }
      const timer = window.setTimeout(() => {
        host.style.setProperty("--assembly", "1");
      }, delay);
      return () => window.clearTimeout(timer);
    }

    let frame = 0;
    let active = false;

    const update = () => {
      frame = 0;
      const rect = host.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Fully exploded when the frame enters from below, fully assembled by
      // the time it reaches the middle of the screen — and it stays assembled.
      const progress = (viewport * 0.92 - rect.top) / (viewport * 0.62 + rect.height * 0.35);
      host.style.setProperty("--assembly", clamp(progress, 0, 1).toFixed(4));
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
      { rootMargin: "160px 0px" },
    );
    observer.observe(host);
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [trigger, reduced, entered, delay]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={alt}
      className={cn("relative isolate", className)}
      style={
        {
          "--assembly": trigger === "enter" ? 0 : 0,
          aspectRatio: `${width} / ${height}`,
        } as CSSProperties
      }
    >
      {strata.map(({ i, offset, spread }) => {
        // Gaps open between the strata while exploded, so the frame has to grow
        // to hold them: each band is pushed out from the centre of the stack.
        const centred = i - (bands - 1) / 2;
        return (
          <div
            key={i}
            aria-hidden="true"
            className="assembly-band absolute inset-x-0 overflow-hidden"
            style={
              {
                top: `${(i * 100) / bands}%`,
                height: `${100 / bands}%`,
                backgroundImage: `url(${src})`,
                backgroundSize: `100% ${bands * 100}%`,
                backgroundPosition: `0 ${offset}%`,
                backgroundRepeat: "no-repeat",
                transform: `translate3d(
                  calc((1 - var(--assembly)) * ${(spread * 100).toFixed(1)}%),
                  calc((1 - var(--assembly)) * ${(centred * 7).toFixed(2)}%),
                  0)`,
                opacity: `calc(0.45 + var(--assembly) * 0.55)`,
                transition:
                  trigger === "enter"
                    ? `transform 1500ms var(--ease-out-expo) ${i * 90}ms, opacity 900ms linear ${i * 90}ms`
                    : undefined,
              } as CSSProperties
            }
          />
        );
      })}

      {/* Dimension lines and readouts, present only while the stack is apart. */}
      {readouts && readouts.length > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ opacity: "calc(1 - var(--assembly))" }}
        >
          {readouts.slice(0, bands - 1).map((readout, i) => (
            <div
              key={readout}
              className="absolute inset-x-0 flex items-center gap-2"
              style={{ top: `${((i + 1) * 100) / bands}%` }}
            >
              <span className="h-px flex-1 bg-[var(--accent)] opacity-60" />
              <span className="mono-label whitespace-nowrap text-[0.5625rem] text-[var(--accent)]">
                {readout}
              </span>
              <span className="h-px w-4 bg-[var(--accent)] opacity-60" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
