"use client";

import { useEffect, useRef } from "react";

/**
 * The light the whole site sits in.
 *
 * One fixed field behind every page: a white core through the middle of the
 * viewport, baby blue blooming at the shoulders, a breath of cream and one of
 * clay at the far corners. It is deliberately not a gradient *on* a section —
 * sections here paint nothing, so this is what shows through all of them, and
 * scrolling moves the page across a sky that stays put.
 *
 * Two things move it, both barely. The blooms drift on their own two-minute
 * cycles in CSS, and on a desktop the whole field leans a few pixels toward
 * the pointer. The lean is deliberately over-damped — 1.6s of easing on a
 * 26px maximum — so it can never be perceived as "following the mouse". You
 * should only be able to tell that the page is not a photograph.
 *
 * Cost: one composited layer, one `transform` written at most once per frame,
 * and nothing at all when the visitor has asked for reduced motion.
 */
export function Atmosphere() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    /* Pointer parallax is a desktop affordance and a reduced-motion
       violation; a device without a fine pointer never installs it. */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      field.style.setProperty("--ax", x.toFixed(2));
      field.style.setProperty("--ay", y.toFixed(2));
    };

    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth - 0.5) * -26;
      y = (event.clientY / window.innerHeight - 0.5) * -18;
      if (!frame) frame = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="atmosphere" aria-hidden="true">
      <div ref={fieldRef} className="atmosphere__field">
        <div className="atmosphere__bloom atmosphere__bloom--a" />
        <div className="atmosphere__bloom atmosphere__bloom--b" />
        <div className="atmosphere__bloom atmosphere__bloom--c" />
        <div className="atmosphere__bloom atmosphere__bloom--d" />
      </div>
      {/* Painted over the drift, not under it: whatever the blooms are doing,
          the middle of the screen stays clean enough to set type on. */}
      <div className="atmosphere__core" />
    </div>
  );
}
