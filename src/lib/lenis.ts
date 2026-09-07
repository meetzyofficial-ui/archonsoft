"use client";

import type Lenis from "lenis";

/**
 * Registry for the single Lenis instance.
 *
 * Locking `body` overflow is not enough on its own: momentum scrolling listens
 * on the window and would keep driving the page behind an open overlay. Any
 * component that takes over the screen pauses the instance through here.
 */
let instance: Lenis | null = null;

export function registerLenis(next: Lenis | null): void {
  instance = next;
}

export function pauseScroll(): void {
  instance?.stop();
}

export function resumeScroll(): void {
  instance?.start();
}

export function scrollToTop(immediate = true): boolean {
  if (!instance) return false;
  instance.scrollTo(0, { immediate });
  return true;
}
