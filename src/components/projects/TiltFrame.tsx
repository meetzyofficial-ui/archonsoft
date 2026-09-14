"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Depth under the hand.
 *
 * Publishes the pointer's position inside the frame as `--mx` / `--my`
 * (−1…1), eased, and nothing else; the stage's layers read them in CSS at
 * their own depth, so a phone in front moves further than the one behind it.
 * Installed only for a fine pointer that can hover and never under reduced
 * motion. On leave it eases home rather than snapping.
 */
export function TiltFrame({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let frame = 0;

    const step = () => {
      now.x += (target.x - now.x) * 0.12;
      now.y += (target.y - now.y) * 0.12;
      el.style.setProperty("--mx", now.x.toFixed(3));
      el.style.setProperty("--my", now.y.toFixed(3));
      if (Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.002) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
      }
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      target.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={cn("tilt-frame", className)} style={style}>
      {children}
    </div>
  );
}
