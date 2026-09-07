"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { clamp, cn } from "@/lib/utils";

/**
 * A product world, composed on scroll.
 *
 * Not a carousel. Each real screen travels in from off-stage and docks at a
 * fixed place on a board, so by the end of the scene the visitor is looking at
 * the whole system at once rather than at one screenshot after another. It is
 * the same argument the exploded assembly makes at the level of a single
 * screen, made again at the level of a product.
 *
 * One scroll number drives every screen's transform, written straight to the
 * element in a rAF callback, so the whole scene costs no React renders. On a
 * narrow viewport the board cannot hold four planes, so the same code docks
 * them one at a time in the centre instead.
 *
 * `.no-js` and `prefers-reduced-motion` collapse the stage in CSS, which
 * leaves a plain vertical list of screens — see globals.css.
 */

export type Dock = {
  /** Final position, as a percentage of the stage from its centre. */
  x: number;
  y: number;
  scale: number;
  /** Degrees. Kept tiny — this is a board, not a scattered moodboard. */
  rotate?: number;
};

/** Where each plane ends up. Index 0 is the one the eye should land on. */
const DESKTOP_DOCKS: Dock[] = [
  { x: -6, y: 0, scale: 1 },
  { x: 22, y: -8, scale: 0.78, rotate: -1.5 },
  { x: 40, y: 8, scale: 0.62, rotate: 1.5 },
  { x: 54, y: -6, scale: 0.48 },
];

const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);

export function ProductBoard({
  children,
  count,
  aside,
  counterLabel,
}: {
  /** One element per plane, in dock order. */
  children: ReactNode[];
  count: number;
  /** Pinned column beside the board on wide screens. */
  aside?: ReactNode;
  counterLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const planesRef = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [active, setActive] = useState(1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;

    const planes = planesRef.current;
    let frame = 0;
    let lastActive = -1;

    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = clamp(-rect.top / scrollable, 0, 1);
      // Each plane gets its own slice of the pass, overlapping by half so the
      // next one is already moving before the last has settled.
      const span = 1 / (count + 0.6);

      for (let i = 0; i < count; i += 1) {
        const node = planes[i];
        if (!node) continue;

        const local = easeOut(clamp((progress - i * span * 0.85) / span, 0, 1));
        const dock = isWide
          ? (DESKTOP_DOCKS[i] ?? DESKTOP_DOCKS[DESKTOP_DOCKS.length - 1]!)
          : { x: 0, y: 0, scale: 1 };

        // Entry vector: further along the line it will dock on, so a plane
        // always arrives from the side of the board it belongs to.
        const fromX = isWide ? dock.x + 120 : 0;
        const fromY = isWide ? dock.y + 14 : 90;
        const fromScale = isWide ? dock.scale * 0.86 : 0.9;

        const x = fromX + (dock.x - fromX) * local;
        const y = fromY + (dock.y - fromY) * local;
        const scale = fromScale + (dock.scale - fromScale) * local;
        const rotate = (dock.rotate ?? 0) * local;

        // On a narrow screen only the arriving plane is on stage.
        const exit = isWide ? 0 : easeOut(clamp((progress - (i + 0.85) * span * 0.85) / span, 0, 1));

        node.style.transform = `translate3d(${x.toFixed(2)}%, ${(y - exit * 12).toFixed(2)}%, 0) scale(${(scale * (1 - exit * 0.12)).toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`;
        node.style.opacity = (local * (1 - exit)).toFixed(3);
        node.style.zIndex = String(20 - i);
        node.style.pointerEvents = local > 0.8 ? "auto" : "none";
      }

      const next = clamp(Math.round(progress * (count - 1)) + 1, 1, count);
      if (next !== lastActive) {
        lastActive = next;
        setActive(next);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      for (const node of planes) node?.removeAttribute("style");
    };
  }, [count, isWide, reduced]);

  return (
    <div
      ref={trackRef}
      data-board=""
      className="stage-track"
      style={{ "--stage-height": `${count * 78 + 60}svh` } as CSSProperties}
    >
      <div className="stage-viewport">
        <div className="frame relative flex h-full w-full items-center">
          {aside ? (
            <div className="pointer-events-none absolute inset-y-0 left-[var(--spacing-gutter)] z-30 hidden w-[22%] flex-col justify-center lg:flex">
              <div className="pointer-events-auto">{aside}</div>
            </div>
          ) : null}

          {children.slice(0, count).map((child, index) => (
            <div
              key={index}
              ref={(node) => {
                planesRef.current[index] = node;
              }}
              className={cn(
                "stage-card flex w-full justify-center",
                // The planes are phone-shaped; cap them so they never stretch
                // past the resolution the source screenshots actually have.
                "[&>*]:w-[min(74vw,300px)] lg:[&>*]:w-[min(28vw,340px)]",
              )}
            >
              {child}
            </div>
          ))}

          <div
            aria-hidden="true"
            className="stage-counter pointer-events-none absolute bottom-5 left-[var(--spacing-gutter)] z-40 items-end gap-3 md:bottom-7"
          >
            <span className="mono-label text-[var(--accent)]">
              {String(active).padStart(2, "0")}
            </span>
            <span className="mb-[3px] block h-px w-8 bg-[var(--line-strong)]" />
            <span className="mono-label text-[var(--fg-mute)]">
              {String(count).padStart(2, "0")}
            </span>
            {counterLabel ? (
              <span className="mono-label ml-3 text-[var(--fg-mute)]">{counterLabel}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
