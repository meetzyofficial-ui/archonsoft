"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArchonIcon } from "@/components/chrome/Wordmark";
import { Conversation, Detail, HostCard, WorldUI } from "@/components/world/WorldUI";
import type { WorldCopy } from "@/components/world/WorldGate";
import { discovery } from "@/components/world/systems/discovery";
import { stopSound } from "@/components/world/systems/audio";
import type { ZoneId } from "@/data/world-map";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { isLocale, type Locale } from "@/lib/i18n";
import type { PreparedDisplay, PreparedGuide, WorldPayload } from "@/lib/worldPayload";
import { cn } from "@/lib/utils";

/**
 * Archon World — the experience layer.
 *
 * It sits over the ordinary home page rather than replacing it, which is what
 * lets the world be as large as it likes: the document underneath is still the
 * crawlable, accessible, server-rendered site, so nothing about search, screen
 * readers or a machine that cannot run it depends on any of this.
 *
 * The opening is a sequence, not a menu. Dark space and a few stars paint on
 * the first frame, in DOM; the mark appears; behind it the world builds and,
 * when it is ready, reveals itself under a slow camera that comes down out
 * of the sky — planet, landmark, islands, ocean, the project stations, and
 * finally the explorer standing on the plaza. Only then does it ask for a
 * language, Turkish first, and offer the way in. Entering hands the camera
 * to the explorer's own.
 *
 * The world's language is its own: chosen here, remembered in the browser,
 * changeable from the interface, and never a reload.
 */

const WorldScene = dynamic(
  () => import("@/components/world/WorldScene").then((m) => m.WorldScene),
  { ssr: false },
);

type Stage = "opening" | "reveal" | "world";

export const WORLD_LANG_KEY = "archon-world-lang";

/** Everything the tab key can land on. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function readLang(): Locale {
  try {
    const stored = window.localStorage.getItem(WORLD_LANG_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    /* A private window: Turkish, as always by default. */
  }
  return "tr";
}

export function ArchonWorld({
  copies,
  payloads,
  touch,
  compact,
  onExit,
}: {
  locale: Locale;
  copies: Record<Locale, WorldCopy>;
  payloads: Record<Locale, WorldPayload>;
  /** Driven by thumbs rather than a keyboard and a captured mouse. */
  touch: boolean;
  /** The smaller scene: fewer people, lower pixel ratio, staged build. */
  compact: boolean;
  onExit: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  /* Everyone walks; a touch visitor who asked for reduced motion is taken
     round by the tour instead. */
  const mode: "explore" | "tour" = reduced && touch ? "tour" : "explore";
  const [stage, setStage] = useState<Stage>("opening");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<PreparedDisplay | null>(null);

  /* The language. Turkish until the browser says otherwise. */
  const [lang, setLang] = useState<Locale>("tr");
  useEffect(() => {
    setLang(readLang());
  }, []);
  const chooseLang = useCallback((next: Locale) => {
    setLang(next);
    try {
      window.localStorage.setItem(WORLD_LANG_KEY, next);
    } catch {
      /* Not remembered; still applied. */
    }
  }, []);
  const payload = payloads[lang];
  const copy = copies[lang];

  /* Opening a panel is what counts as having found it — and this is the only
     place both ways of opening one meet. Recorded down in the display instead,
     it missed the guided tour entirely: on a phone every panel is opened from
     the district list rather than by walking up to it, so a touch visitor
     could read the whole world and be told they had found none of it. */
  const inspect = useCallback((display: PreparedDisplay) => {
    discovery.find(display.id);
    setOpen(display);
  }, []);
  /* A conversation with a project's guides. Opening one is what counts as
     having been told about the project; the guides record it themselves. */
  const [talking, setTalking] = useState<PreparedGuide | null>(null);
  const talk = useCallback((guide: PreparedGuide) => {
    setOpen(null);
    setTalking(guide);
  }, []);
  /* A language change mid-conversation re-points the open card at the same
     guide in the new language. */
  useEffect(() => {
    setTalking((current) => (current ? (payload.guides.find((g) => g.id === current.id) ?? null) : null));
    setOpen((current) => (current ? (payload.displays.find((d) => d.id === current.id) ?? null) : null));
  }, [payload]);

  /* The host's conversation. */
  const [hosting, setHosting] = useState(false);
  const hostTalk = useCallback(() => {
    setOpen(null);
    setTalking(null);
    setHosting(true);
  }, []);
  const hostAction = useMemo(() => ({ label: copy.host.label, action: `${copy.host.talk}` }), [copy.host.label, copy.host.talk]);

  /* A card over the world needs the mouse back: the pointer lock is
     released when one opens, so its controls can be clicked. */
  useEffect(() => {
    if ((open || talking || hosting) && document.pointerLockElement) document.exitPointerLock?.();
  }, [hosting, open, talking]);

  const [tourZone, setTourZone] = useState<ZoneId>("hub");
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);

  /* Real progress, not a bar on a timer. Every texture in the world goes
     through three's default loading manager, so this is the number of things
     that have actually arrived.

     The library is fetched here rather than imported at the top of the file:
     three is the largest thing this site ships, and nothing on the first
     painted frame needs it. The scene mounts a beat after the opening has
     painted, so the world is building while the mark is being read. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 350);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    let restore: (() => void) | null = null;
    void import("three").then((THREE) => {
      if (cancelled) return;
      const manager = THREE.DefaultLoadingManager;
      manager.onProgress = (_url, loaded, total) => {
        setProgress(total > 0 ? loaded / total : 0);
      };
      restore = () => {
        manager.onProgress = () => {};
      };
    });
    return () => {
      cancelled = true;
      restore?.();
    };
  }, [mounted]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      stopSound();
    };
  }, []);

  /* Focus stays inside.
     The overlay covers the viewport and every sibling in the body is marked
     inert while it is up, so there is nowhere legitimate for the tab key to
     go — and yet it went there: tabbing off the last control left focus on
     nothing at all, with the visitor holding a keyboard and no way back to
     the world or out of it. Wrapping is the whole fix, and it is what makes
     the opening screen behave like the modal it already is. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element.classList.contains("sr-only"),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    document.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const exit = useCallback(() => {
    setLeaving(true);
    stopSound();
    if (document.pointerLockElement) document.exitPointerLock?.();
    window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      onExit();
    }, 420);
  }, [onExit]);

  /* Escape leaves the world — but only when the browser has not just used it
     to release the pointer lock, and never while something is open in front of
     the world. Getting this wrong makes the one key everybody presses do two
     things at once. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.pointerLockElement) return;
      if (open || talking || hosting) return;
      exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, hosting, open, talking]);

  /* The site underneath is made inert while the world is up: `aria-hidden`
     alone takes it out of the accessibility tree but leaves every link in it
     focusable, so the first thing a keyboard reaches is a skip link into
     content nobody can see. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const host = root.parentElement;
    if (!host) return;
    const siblings = (Array.from(host.children) as HTMLElement[]).filter(
      (element) =>
        element !== root &&
        !element.contains(root) &&
        element.tagName !== "SCRIPT" &&
        !element.hasAttribute("inert"),
    );
    siblings.forEach((element) => element.setAttribute("inert", ""));
    return () => siblings.forEach((element) => element.removeAttribute("inert"));
  }, []);

  /* The reveal begins once the scene reports itself ready and the first
     textures have had a moment to land. */
  useEffect(() => {
    if (stage !== "opening" || !ready) return;
    const timer = window.setTimeout(() => setStage("reveal"), reduced ? 0 : 500);
    return () => window.clearTimeout(timer);
  }, [ready, reduced, stage]);

  /* What the camera is passing, named, as it comes down: a small line of
     text keeping time with the sweep. */
  const [beat, setBeat] = useState(-1);
  useEffect(() => {
    if (stage !== "reveal") return;
    setBeat(0);
    const timers = copy.revealing.map((_, i) => window.setTimeout(() => setBeat(i), 300 + i * 1150));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [copy.revealing, stage]);

  /* The language question waits for the sweep to have shown something. */
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (stage !== "reveal") return;
    const timer = window.setTimeout(() => setAsking(true), reduced ? 0 : 7200);
    return () => window.clearTimeout(timer);
  }, [reduced, stage]);
  useEffect(() => {
    if (asking) enterRef.current?.focus();
  }, [asking]);

  const entered = stage === "world";
  const sceneMode: "explore" | "tour" | "overture" = entered ? mode : "overture";

  const overlay = (
    <div
      ref={rootRef}
      role="region"
      aria-label={copy.label}
      lang={lang}
      /* The world is night. Its chrome takes the ink token set regardless of
         the scheme of the page it opened from. */
      data-scheme="ink"
      data-stage={stage}
      className={cn(
        "world-overlay fixed inset-0 z-[120] overflow-hidden bg-[#03050b] text-[var(--fg)]",
        "transition-opacity duration-[420ms] ease-[var(--ease-out-expo)]",
        leaving ? "opacity-0" : "opacity-100",
      )}
    >
      {/* The way out is the first thing a keyboard or screen reader meets. */}
      <button
        type="button"
        onClick={exit}
        className="sr-only mono-label focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[140] focus:bg-[var(--color-paper)] focus:px-4 focus:py-3 focus:text-[var(--color-ink)]"
      >
        {copy.skip}
      </button>

      {/* Space, before the world: a field of faint stars in CSS, painted on
          the first frame. */}
      <div
        aria-hidden="true"
        className={cn(
          "world-stars absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-out-expo)]",
          stage === "opening" ? "opacity-100" : "opacity-0",
        )}
      />

      {/* The environment. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-[2400ms] ease-[var(--ease-out-expo)]",
          stage === "opening" ? "opacity-0" : "opacity-100",
        )}
      >
        {mounted ? (
          <WorldScene
            payload={payload}
            mode={sceneMode}
            compact={compact}
            tourZone={tourZone}
            reduced={reduced}
            onOpen={inspect}
            onTalk={talk}
            onHost={hostTalk}
            host={hostAction}
            onReady={() => setReady(true)}
          />
        ) : null}
      </div>

      {/* The opening: the mark, then the question. */}
      <div
        className={cn(
          "absolute inset-0 z-[130] flex flex-col justify-between transition-opacity duration-[900ms] ease-[var(--ease-out-expo)]",
          entered ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        aria-hidden={entered}
      >
        <div className="frame flex items-center justify-between pt-6">
          <p className="mono-micro text-[var(--fg-mute)]">{copy.label}</p>
          <button
            type="button"
            onClick={exit}
            className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
          >
            {copy.mainSite} →
          </button>
        </div>

        {/* The mark, centred, arriving. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              "flex flex-col items-center transition-all duration-[1400ms] ease-[var(--ease-out-expo)]",
              stage === "opening" ? "translate-y-0 opacity-100" : asking ? "-translate-y-[10vh] scale-[0.5] opacity-0" : "translate-y-0 opacity-100",
            )}
          >
            <ArchonIcon className="world-mark h-[clamp(3.5rem,9vw,7rem)] text-[var(--fg)]" />
            <p className="mono-label mt-8 tracking-[0.3em] text-[var(--fg)]">ARCHON WORLD</p>
            <p
              className={cn(
                "mono-micro mt-3 text-[var(--fg-mute)] transition-opacity duration-700",
                stage === "opening" ? "opacity-100" : "opacity-0",
              )}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {payload.copy.loading} · {String(Math.round(Math.max(0.02, progress) * 100)).padStart(3, "0")}
            </p>
            {/* What the camera is passing. */}
            <ul
              aria-hidden="true"
              className={cn(
                "mono-micro mt-4 flex flex-wrap justify-center gap-x-4 transition-opacity duration-700",
                stage === "reveal" && !asking ? "opacity-100" : "opacity-0",
              )}
            >
              {copy.revealing.map((word, i) => (
                <li key={word} className={cn("transition-colors duration-700", i === beat ? "text-[var(--fg)]" : "text-[var(--fg-mute)] opacity-50")}>
                  {word}
                </li>
              ))}
            </ul>
          </div>

          {/* The question, and the way in. */}
          <div
            className={cn(
              "absolute inset-x-0 top-[46%] flex flex-col items-center transition-all duration-[1100ms] ease-[var(--ease-out-expo)]",
              asking && !entered ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
            )}
          >
            <p className="text-sub text-center text-[var(--fg)]">{copy.tagline}</p>
            <p className="mono-micro mt-6 text-[var(--fg-mute)]">{copy.chooseLanguage}</p>
            <div className="mt-4 flex items-center gap-3" role="radiogroup" aria-label={copy.language}>
              {(["tr", "en"] as Locale[]).map((one) => (
                <button
                  key={one}
                  type="button"
                  role="radio"
                  aria-checked={lang === one}
                  data-lang={one}
                  lang={one}
                  onClick={() => chooseLang(one)}
                  className={cn(
                    "mono-label min-w-[9rem] cursor-pointer border px-6 py-3 transition-colors duration-300",
                    lang === one
                      ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--color-ink)]"
                      : "border-[var(--line-strong)] text-[var(--fg-dim)] hover:border-[var(--fg)] hover:text-[var(--fg)]",
                  )}
                >
                  {copies[one].languageName}
                </button>
              ))}
            </div>
            <button
              ref={enterRef}
              type="button"
              data-enter
              onClick={() => setStage("world")}
              className="mono-label group/enter link-rule mt-10 inline-flex cursor-pointer items-center gap-4 text-[var(--fg)]"
            >
              {copy.enterWorld}
              <span
                aria-hidden="true"
                className="relative block h-px w-12 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/enter:w-20"
              >
                <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
              </span>
            </button>
          </div>
        </div>

        <div className="frame pb-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {copy.lead.map((line) => (
              <li key={line} className="mono-micro text-[var(--fg-mute)]">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The world's own interface. */}
      {entered ? (
        <WorldUI
          payload={payload}
          world={copy}
          locale={lang}
          onLang={chooseLang}
          mode={mode}
          touch={touch}
          tourZone={tourZone}
          onTour={setTourZone}
          onOpen={inspect}
          onTalk={talk}
          onHost={hostTalk}
          onExit={exit}
          quiet={Boolean(open || talking || hosting)}
        />
      ) : null}

      {hosting ? <HostCard world={copy} copy={payload.copy} locale={lang} onClose={() => setHosting(false)} /> : null}

      {open ? <Detail display={open} copy={payload.copy} onClose={() => setOpen(null)} /> : null}
      {talking ? (
        <Conversation
          key={`${talking.id}:${lang}`}
          guide={talking}
          copy={payload.copy}
          locale={lang}
          onClose={() => setTalking(null)}
        />
      ) : null}
    </div>
  );

  /* Returned as it stands, not through a portal: `WorldMount` already renders
     this as the last child of `<body>`, and a portal has to wait for an effect
     to find its host, which would keep the opening off the server-rendered
     HTML. */
  return overlay;
}
