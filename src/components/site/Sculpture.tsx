"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

const SculptureScene = dynamic(() => import("@/components/site/SculptureScene"), {
  ssr: false,
});

/**
 * The gate in front of the WebGL form.
 *
 * Performance is part of this design, so the sculpture is not allowed to be
 * part of the load. Nothing here reaches the network until the browser is
 * idle, the page has painted, and the visitor has not asked for less motion.
 * If any of that fails — an old device, a reduced-motion preference, no
 * WebGL — the site simply has no sculpture in it, and the atmosphere behind
 * the page is unchanged. Nothing on any page depends on it being there.
 *
 * It fades up over two and a half seconds rather than appearing, so a visitor
 * who is already reading is never interrupted by it arriving.
 */
export function Sculpture() {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (reduced) return;

    /* Two cheap disqualifications before anything is imported. */
    const small = window.matchMedia("(max-width: 640px)").matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores <= 2) return;
    setCompact(small || cores <= 4);

    /* Not until the page has finished loading and then gone quiet.
       `requestIdleCallback` alone fires during the load on a fast connection,
       which put a WebGL context creation and a first frame right in the middle
       of the largest contentful paint — it cost two seconds on routes that
       have no picture in them at all. Waiting for `load` and then for idle
       means the sculpture can only ever arrive after the page is readable. */
    let cancelled = false;
    let idle = 0;
    const cancelIdle = () => {
      if (!idle) return;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };

    const queue = () => {
      const start = () => {
        if (!cancelled) setMounted(true);
      };
      idle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(start, { timeout: 6000 })
          : window.setTimeout(start, 2400);
    };

    if (document.readyState === "complete") queue();
    else window.addEventListener("load", queue, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", queue);
      cancelIdle();
    };
  }, [reduced]);

  if (reduced || !mounted) return null;

  return (
    <div className="sculpture" data-ready={mounted ? "true" : "false"} aria-hidden="true">
      <SculptureScene compact={compact} />
    </div>
  );
}
