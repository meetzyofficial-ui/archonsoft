"use client";

import { useEffect, useRef } from "react";

/**
 * The night the whole site sits in.
 *
 * One fixed field behind every page: graphite ground, three light pools a few
 * percent strong — a cold key high on the right where the mark hangs, a navy
 * fill low on the left, a trace of the robot's ember at the foot — a hairline
 * grid laid into the floor in perspective, and a vignette. Sections paint
 * nothing, so this is what shows through all of them, and scrolling moves the
 * page across a room that stays put.
 *
 * Two things move it, both barely. The pools drift on their own two-minute
 * cycles in CSS, and on a desktop the whole field leans a few pixels toward
 * the pointer, over-damped so it can never read as "following the mouse".
 *
 * The mark drawn here is the flat one — the live, lit mark is a WebGL layer
 * above this (`LogoField`), and when it arrives it stamps
 * `html[data-logo-live]` so this one steps back. Anyone the live mark is not
 * for (reduced motion, no WebGL, a low-core device) keeps this one, which
 * costs nothing.
 *
 * Cost: a handful of composited layers, one `transform` written at most once
 * per frame, and nothing at all under reduced motion.
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
        <div className="atmosphere__grid" />
        {/* The supplied mark's geometry, unchanged: three left-aligned bars,
            7.4 high on an 11-unit pitch, 34 / 24.5 / 15 wide. */}
        <svg className="atmosphere__mark" viewBox="0 0 34 29.4">
          <rect x="0" y="0" width="34" height="7.4" fill="currentColor" />
          <rect x="0" y="11" width="24.5" height="7.4" fill="currentColor" />
          <rect x="0" y="22" width="15" height="7.4" fill="currentColor" />
        </svg>
      </div>
      {/* Over the drift, not under it: whatever the pools are doing, the
          edges of the screen stay quiet. */}
      <div className="atmosphere__core" />
    </div>
  );
}
