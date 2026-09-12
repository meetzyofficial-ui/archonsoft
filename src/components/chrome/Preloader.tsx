"use client";

import { useEffect, useState } from "react";
import { ArchonIcon } from "@/components/chrome/Wordmark";
import { markEntered } from "@/lib/entrance";
import { cn } from "@/lib/utils";

const MIN_MS = 280;
const MAX_MS = 900;
const KEY = "archon:entered";

/**
 * The entrance.
 *
 * It waits on something real - fonts resolving and the window load event -
 * rather than on a timer, with a floor so the wipe is not a flicker and a
 * ceiling so a slow asset can never hold the page hostage. It runs once per
 * session, and not at all under reduced motion. The page renders underneath
 * the whole time, so nothing is actually being blocked.
 */
export function Preloader() {
  const [done, setDone] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const seen = (() => {
      try {
        return window.sessionStorage.getItem(KEY) === "1";
      } catch {
        return false;
      }
    })();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced) {
      setInstant(true);
      setDone(true);
      markEntered();
      return;
    }

    const start = performance.now();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      const elapsed = performance.now() - start;
      window.setTimeout(() => {
        setDone(true);
        markEntered();
        try {
          window.sessionStorage.setItem(KEY, "1");
        } catch {
          /* Private mode: the entrance simply plays again next time. */
        }
      }, Math.max(0, MIN_MS - elapsed));
    };

    // Fonts, but capped. Waiting on `load` pushed LCP past four seconds on a
    // throttled connection, and even fonts.ready can stall behind a slow
    // subset - so it races a short timer and the ceiling below catches the
    // rest. The entrance is a flourish; it does not get to hold the page.
    void Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((resolve) => window.setTimeout(resolve, 420)),
    ]).then(finish);
    const ceiling = window.setTimeout(finish, MAX_MS);

    return () => window.clearTimeout(ceiling);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("is-entering", !done);
    return () => document.documentElement.classList.remove("is-entering");
  }, [done]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        // `entrance-panel` is hidden by the no-js rule in globals.css: without
        // JavaScript nothing would ever lift this, and the visitor would be
        // left looking at an empty ink screen.
        "entrance-panel pointer-events-none fixed inset-0 z-[98] bg-[var(--color-paper)] text-[var(--color-ink)]",
        !instant && "transition-[clip-path] duration-[900ms] ease-[var(--ease-in-out-quart)]",
        done ? "[clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0_0)]",
      )}
    >
      <div
        className={cn(
          "frame flex h-full flex-col justify-between py-8",
          "transition-opacity duration-300",
          instant || done ? "opacity-0" : "opacity-100",
        )}
        style={{ transitionDelay: done ? "0ms" : "80ms" }}
      >
        <span className="mono-label flex items-center gap-2.5 text-[var(--color-ink)]">
          <ArchonIcon className="h-3" />
          Archon Soft
        </span>
        <span className="mono-label self-end text-[var(--color-slate)]">
          Ankara
        </span>
      </div>
    </div>
  );
}
