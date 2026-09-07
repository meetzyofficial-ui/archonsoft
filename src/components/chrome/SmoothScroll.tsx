"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { registerLenis, scrollToTop } from "@/lib/lenis";

/**
 * Momentum scrolling.
 *
 * Deliberately light-touch: a short duration and a plain exponential ease, so
 * the page still feels attached to the wheel rather than floating away from it.
 * Skipped entirely under reduced motion, where native scrolling is the correct
 * behaviour, and torn down on unmount so no rAF loop leaks between routes.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Native scrolling on touch: momentum there is the platform's job.
      syncTouch: false,
    });

    registerLenis(lenis);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // In-page anchors need to be handed to Lenis or they fight the rAF loop.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.replaceState(null, "", `#${id}`);
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      registerLenis(null);
      lenis.destroy();
    };
  }, [reduced]);

  // Lenis writes its own scroll position every frame, so a plain
  // window.scrollTo on a route change is undone before it is painted. Reset
  // through the instance when there is one, natively when there is not.
  useEffect(() => {
    if (!scrollToTop()) window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
