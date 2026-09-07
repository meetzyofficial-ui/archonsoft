"use client";

import { useEffect, useRef, useState } from "react";
import { useHasPointer, usePrefersReducedMotion } from "@/lib/hooks";

const INTERACTIVE = 'a[href], button, [role="button"], input, textarea, select, [data-cursor]';

/**
 * A hairline reticle that trails the pointer.
 *
 * The native cursor is left visible on purpose - the reticle adds state
 * feedback without taking away the affordances people rely on for selecting
 * text and hitting small targets. Mounted only for fine pointers, and not at
 * all under reduced motion.
 */
export function Cursor() {
  const hasPointer = useHasPointer();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ active: boolean; label: string | null }>({
    active: false,
    label: null,
  });
  const [visible, setVisible] = useState(false);

  const enabled = hasPointer && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...pointer };
    let frame = 0;
    let seen = false;

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!seen) {
        seen = true;
        current.x = pointer.x;
        current.y = pointer.y;
        setVisible(true);
      }
    };

    const tick = () => {
      current.x += (pointer.x - current.x) * 0.17;
      current.y += (pointer.y - current.y) * 0.17;
      node.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.(INTERACTIVE);
      if (target instanceof HTMLElement) {
        setState({ active: true, label: target.dataset.cursorLabel ?? null });
      } else {
        setState({ active: false, label: null });
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-cursor-root=""
      className="pointer-events-none fixed left-0 top-0 z-[96] hidden md:block"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms linear" }}
    >
      <div
        className="grid place-items-center border border-[var(--fg)] transition-[width,height,border-color,background-color,transform] duration-[450ms] ease-[var(--ease-out-expo)]"
        style={{
          width: state.active ? (state.label ? 84 : 46) : 26,
          height: state.active ? (state.label ? 84 : 46) : 26,
          borderRadius: state.label ? "50%" : "0",
          transform: `rotate(${state.active ? 45 : 0}deg)`,
          borderColor: state.active ? "var(--accent)" : "var(--line-strong)",
          backgroundColor: state.label ? "var(--accent)" : "transparent",
        }}
      >
        {state.label ? (
          <span
            className="mono-label text-[var(--bg)]"
            style={{ transform: "rotate(-45deg)" }}
          >
            {state.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
