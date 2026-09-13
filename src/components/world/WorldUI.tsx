"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { guideStore } from "@/components/world/npc/Guides";
import { hostStore } from "@/components/world/npc/Host";
import { teleportStore } from "@/components/world/systems/teleport";
import { touchInput } from "@/components/world/systems/touch";
import { interactables } from "@/components/world/systems/focus";
import { WORLD_DESTINATIONS } from "@/data/world-destinations";
import { discovery } from "@/components/world/systems/discovery";
import { focusStore, poseStore, zoneStore } from "@/components/world/systems/focus";
import { blip, soundStore, toggleSound } from "@/components/world/systems/audio";
import { voiceStore } from "@/components/world/systems/voice";
import { ZONES, type ZoneId } from "@/data/world-map";
import type { WorldCopy } from "@/components/world/WorldGate";
import type { PreparedDisplay, PreparedGuide, WorldPayload } from "@/lib/worldPayload";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The interface over the world.
 *
 * As little as it can be, and where the brief asked for it: how to move at
 * the bottom left, what has been found at the bottom right, the name of the
 * district or project you are standing in as a passing line, and the prompt
 * for whatever is in front of you at the centre. The two controls a person
 * needs — the sound, the voice, and the way out — sit in the top corner.
 *
 * Every word of it is real DOM: readable, selectable, translated, reachable
 * by a screen reader. The canvas carries no information that is not also
 * written down here.
 */

const EMPTY = { found: 0, noticed: 0, total: 0, complete: false };
const AT_SPAWN = { x: 0, z: 24, level: 0, bearing: "N" };
const NO_GUIDE = { id: null, phase: "idle" as const };
const NO_HOST = { following: false, at: [9.5, 0, 20] as [number, number, number], line: null, said: 0 };
const NO_TELEPORT = { current: "hub" as string | null, phase: 0, direction: null };
const NO_VOICE = { supported: false, enabled: false, speaking: false, paused: false, current: null };
const pad = (n: number) => String(n).padStart(2, "0");
const signed = (n: number) => `${n < 0 ? "−" : "+"}${String(Math.abs(n)).padStart(3, "0")}`;

/* How far a thumb's drag turns the view, by the visitor's own setting. */
const LOOK_SCALES = { slow: 0.7, normal: 1, fast: 1.45 } as const;
const LOOK_KEY = "archon-world-look";

export function WorldUI({
  payload,
  world,
  locale,
  onLang,
  mode,
  touch = false,
  tourZone,
  onTour,
  onOpen,
  onTalk,
  onHost,
  onExit,
  quiet = false,
}: {
  payload: WorldPayload;
  /** The world's own words, in its language. */
  world: WorldCopy;
  onHost?: () => void;
  locale: Locale;
  onLang: (lang: Locale) => void;
  mode: "explore" | "tour";
  /** Driven by thumbs: the stick, the look-drag and the jump button. */
  touch?: boolean;
  tourZone: ZoneId;
  onTour: (zone: ZoneId) => void;
  onOpen: (display: PreparedDisplay) => void;
  onTalk: (guide: PreparedGuide) => void;
  onExit: () => void;
  /** Something is open over the world; the prompts step back. */
  quiet?: boolean;
}) {
  const focus = useSyncExternalStore(focusStore.subscribe, focusStore.get, () => null);
  const [look, setLook] = useState<keyof typeof LOOK_SCALES>("normal");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOOK_KEY) as keyof typeof LOOK_SCALES | null;
      if (saved && saved in LOOK_SCALES) {
        setLook(saved);
        touchInput.lookScale = LOOK_SCALES[saved];
      }
    } catch {
      /* No storage, the default. */
    }
  }, []);
  const zone = useSyncExternalStore(zoneStore.subscribe, zoneStore.get, () => "hub");
  const sound = useSyncExternalStore(soundStore.subscribe, soundStore.get, () => false);
  const voice = useSyncExternalStore(voiceStore.subscribe, voiceStore.get, () => NO_VOICE);
  const guide = useSyncExternalStore(guideStore.subscribe, guideStore.get, () => NO_GUIDE);
  const host = useSyncExternalStore(hostStore.subscribe, hostStore.get, () => NO_HOST);
  const teleport = useSyncExternalStore(teleportStore.subscribe, teleportStore.get, () => NO_TELEPORT);
  const [locked, setLocked] = useState(false);
  const [announce, setAnnounce] = useState<string | null>(null);
  const seen = useSyncExternalStore(discovery.subscribe, discovery.get, () => EMPTY);
  const districtNames = useMemo(
    () => new Set(ZONES.map((one) => t(one.label, locale).toLowerCase())),
    [locale],
  );
  const pose = useSyncExternalStore(poseStore.subscribe, poseStore.get, () => AT_SPAWN);

  useEffect(() => {
    discovery.setTotal(payload.total);
  }, [payload.total]);

  useEffect(() => {
    const onChange = () => setLocked(Boolean(document.pointerLockElement));
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  /* Entering a district names it, and counts as having discovered it. */
  useEffect(() => {
    const found = ZONES.find((one) => one.id === zone);
    if (!found) {
      setAnnounce(null);
      return;
    }
    discovery.find(`zone:${found.id}`);
    setAnnounce(t(found.label, locale));
    const timer = window.setTimeout(() => setAnnounce(null), 2600);
    return () => window.clearTimeout(timer);
  }, [locale, zone]);

  useEffect(() => {
    if (focus) blip(720, 0.05, 0.035);
  }, [focus]);

  const greeting = guide.id ? payload.guides.find((one) => one.id === guide.id) : null;
  /* Which project you are standing at, for the contextual line. */
  const nearProject = greeting?.name ?? null;

  return (
    <div data-zone={zone} className="pointer-events-none absolute inset-0 z-[132]">
      {/* Top. */}
      <div className="frame pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between pt-6">
        <div className="pointer-events-auto">
          <p className="mono-micro text-[var(--fg-mute)]">{world.label}</p>
          <p
            aria-live="polite"
            className={cn(
              "mono-label mt-2 text-[var(--fg)] transition-opacity duration-500",
              announce ? "opacity-100" : "opacity-0",
            )}
          >
            {announce ?? " "}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-5 gap-y-2 whitespace-nowrap">
          {mode === "explore" ? (
            <p
              data-pose={`${pose.x},${pose.z},${pose.level}`}
              className="mono-micro hidden text-[var(--fg-mute)] opacity-70 sm:block"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {pose.bearing} {signed(pose.x)} {signed(pose.z)}
              {pose.level > 0 ? ` · +${pose.level}` : ""}
            </p>
          ) : null}
          {touch && mode === "explore" ? (
            <button
              type="button"
              data-look-speed
              onClick={() => {
                const order: (keyof typeof world.lookLevels)[] = ["slow", "normal", "fast"];
                const next = order[(order.indexOf(look) + 1) % order.length]!;
                setLook(next);
                touchInput.lookScale = LOOK_SCALES[next];
                try {
                  window.localStorage.setItem(LOOK_KEY, next);
                } catch {
                  /* Preferences are a courtesy. */
                }
              }}
              className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              {world.look} {world.lookLevels[look]}
            </button>
          ) : null}
          {voice.supported ? (
            <button
              type="button"
              onClick={() => voiceStore.enable(!voice.enabled)}
              aria-pressed={voice.enabled}
              className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              {payload.copy.voice} {voice.enabled ? world.on : world.off}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void toggleSound()}
            aria-pressed={sound}
            className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
          >
            {payload.copy.sound} {sound ? world.on : world.off}
          </button>
          {/* The language, changeable here without leaving the world. */}
          <span className="mono-label flex items-center gap-2" role="radiogroup" aria-label={world.language}>
            {(["tr", "en"] as Locale[]).map((one, i) => (
              <span key={one} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden="true" className="text-[var(--fg-mute)] opacity-50">/</span> : null}
                <button
                  type="button"
                  role="radio"
                  aria-checked={locale === one}
                  data-lang={one}
                  onClick={() => onLang(one)}
                  className={cn(
                    "-my-2 py-2 uppercase transition-colors",
                    locale === one ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
                  )}
                >
                  {one}
                </button>
              </span>
            ))}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
          >
            {payload.copy.exit} →
          </button>
        </div>
      </div>

      {/* Centre: a hairline, and the prompt for what is in front of you. */}
      {mode === "explore" && locked ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
            focus ? "size-3 opacity-90" : "size-1.5 opacity-40",
          )}
        >
          <span className="block size-full rounded-full border border-[var(--fg)]" />
        </div>
      ) : null}

      <div
        data-focus={focus ? "true" : "false"}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-20 transition-all duration-300 ease-[var(--ease-out-expo)]",
          (focus || greeting) && !quiet ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {/* The guide's greeting, when one has noticed you. */}
        {greeting && guide.phase === "greeting" ? (
          <p
            data-greeting={greeting.projectId}
            className="max-w-[40ch] px-4 text-center text-[var(--fg)]"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.3 }}
          >
            {greeting.greetingText}
          </p>
        ) : null}
        {focus ? (
          <>
            {!greeting ? <p className="mono-label text-[var(--fg-dim)]">{focus.label}</p> : null}
            {touch ? (
              /* On glass the prompt is the button. */
              <button
                type="button"
                data-touch-act
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => interactables.get(focus.id)?.activate()}
                className="mono-label pointer-events-auto flex items-center gap-3 border border-[rgba(255,244,232,0.35)] bg-[rgba(10,18,36,0.55)] px-5 py-3 text-[var(--fg)] backdrop-blur"
              >
                {focus.action}
              </button>
            ) : (
              <p className="mono-label flex items-center gap-3 text-[var(--fg)]">
                <span className="inline-flex min-w-7 items-center justify-center border border-[var(--line-strong)] px-2 py-1">
                  E
                </span>
                {focus.action}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* The rail: every destination, one step away. On the tour it moves
          the camera; walking, it teleports the explorer. */}
      {/* On a phone the rail is a column of numbers, thumb-sized, up the left
          edge under the top row; tapping one teleports. */}
      <nav
        aria-label={world.destinations}
        data-rail-compact
        className={cn(
          /* A column up the left in portrait; a row under the top line in
             landscape, where the height is short and the stick sits low. */
          "pointer-events-auto absolute top-[7.5rem] left-[max(var(--spacing-gutter),env(safe-area-inset-left))] flex flex-col gap-2",
          "landscape:top-[3.4rem] landscape:left-1/2 landscape:-translate-x-1/2 landscape:flex-row",
          touch ? "flex" : "sm:hidden",
          "transition-opacity duration-500",
          quiet ? "opacity-40" : "opacity-100",
        )}
      >
        {WORLD_DESTINATIONS.map((dest) => {
          const active = mode === "tour" ? dest.zone === tourZone : teleport.current === dest.id;
          return (
            <button
              key={dest.id}
              type="button"
              data-destination={dest.id}
              aria-label={t(dest.name, locale)}
              aria-current={active ? "true" : undefined}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => (mode === "tour" ? onTour(dest.zone) : teleportStore.request(dest.id))}
              className={cn(
                "mono-micro flex size-11 items-center justify-center rounded-full border backdrop-blur transition-colors",
                active
                  ? "border-[var(--accent)] bg-[rgba(10,18,36,0.6)] text-[var(--fg)] shadow-[0_0_10px_rgba(154,214,255,0.35)]"
                  : "border-[rgba(255,244,232,0.22)] bg-[rgba(10,18,36,0.42)] text-[var(--fg-dim)]",
              )}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {String(dest.number).padStart(2, "0")}
            </button>
          );
        })}
      </nav>
      <nav
        aria-label={world.destinations}
        data-rail
        className={cn(
          "pointer-events-auto absolute top-1/2 left-[var(--spacing-gutter)] -translate-y-1/2",
          touch ? "hidden" : "hidden sm:block",
          "transition-opacity duration-500",
          quiet ? "opacity-40" : "opacity-100",
        )}
      >
        <p className="mono-micro mb-3 text-[var(--fg-mute)] opacity-80">{world.destinations}</p>
        <ol
          className="flex flex-col border-l border-[rgba(255,244,232,0.22)]"
          style={{ background: "linear-gradient(90deg, rgba(10,18,36,0.42), rgba(10,18,36,0))", backdropFilter: "blur(6px)" }}
        >
          {WORLD_DESTINATIONS.map((dest) => {
            const active = mode === "tour" ? dest.zone === tourZone : teleport.current === dest.id;
            return (
              <li key={dest.id}>
                <button
                  type="button"
                  data-destination={dest.id}
                  aria-current={active ? "true" : undefined}
                  onClick={() => (mode === "tour" ? onTour(dest.zone) : teleportStore.request(dest.id))}
                  className={cn(
                    "group/dest relative flex w-full items-baseline gap-3 py-2 pr-5 pl-4 text-left transition-colors duration-300",
                    active ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 -left-px h-4 w-px -translate-y-1/2 transition-all duration-300",
                      active ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" : "bg-transparent group-hover/dest:bg-[rgba(255,244,232,0.5)]",
                    )}
                  />
                  <span className="mono-micro w-5 opacity-70" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {String(dest.number).padStart(2, "0")}
                  </span>
                  <span className="mono-label">{t(dest.name, locale)}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {mode === "explore" ? (
          <p className="mono-micro mt-3 text-[var(--fg-mute)] opacity-60">1 – {WORLD_DESTINATIONS.length} · {world.teleport}</p>
        ) : null}
      </nav>

      {/* The teleport: a brief brightening of the whole frame at the turn. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-150"
        style={{
          opacity: teleport.direction === "out" ? teleport.phase * 0.55 : teleport.direction === "in" ? Math.max(0, 0.55 - teleport.phase * 1.4) : 0,
          background: "radial-gradient(ellipse at 50% 55%, rgba(200,236,255,0.9), rgba(120,190,255,0.35) 40%, rgba(8,14,30,0) 75%)",
        }}
      />

      {/* What the host says as you go, when she is with you. */}
      {host.line && !quiet ? (
        <div className="frame pointer-events-none absolute inset-x-0 top-[9rem] flex justify-center">
          <p
            key={host.said}
            data-host-line
            className="max-w-[46ch] px-4 text-center text-[var(--fg)] [animation:route-enter_500ms_var(--ease-out-expo)_both]"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", lineHeight: 1.35 }}
          >
            {world.host.lines[host.line]}
          </p>
        </div>
      ) : null}

      {/* Thumbs: the look layer under everything, the stick and the jump
          button over it. */}
      {mode === "explore" && touch && !quiet ? <TouchControls jumpLabel={world.jump.split("—").pop()?.trim() ?? "JUMP"} /> : null}

      {/* Bottom. Move on the left, found on the right. */}
      {mode === "explore" ? (
        <div
          className="frame absolute inset-x-0 bottom-0 flex items-end justify-between pb-6"
          style={touch ? { paddingBottom: "calc(env(safe-area-inset-bottom) + 8.25rem)" } : undefined}
        >
          <div>
            {!touch ? (
              <p className="mono-micro text-[var(--fg-mute)] opacity-80">
                {payload.copy.move} · {world.jump}
              </p>
            ) : null}
            {host.following ? (
              <p className={cn("mono-micro mt-1 text-[var(--accent)]", touch && "ml-40")}>{world.host.label} — {world.host.following}</p>
            ) : null}
            {!locked && !touch ? (
              <p className="mono-micro mt-2 text-[var(--fg-dim)]">{payload.copy.look}</p>
            ) : null}
          </div>
          <div className="text-right">
            {nearProject ? (
              <p className="mono-micro mb-2 text-[var(--fg-dim)]">{nearProject}</p>
            ) : null}
            <p className="mono-micro text-[var(--fg-mute)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {seen.complete
                ? payload.copy.foundAll
                : `${pad(seen.found)} / ${pad(seen.total)} ${payload.copy.found}`}
            </p>
          </div>
        </div>
      ) : (
        /* The tour's own navigation, and its own way of reaching the work
           and the people. */
        <div className="frame pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-4 pb-6">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {tourZone === "hub" && onHost ? (
              <li>
                <button
                  type="button"
                  onClick={onHost}
                  className="mono-label -my-1 border border-[#f2a889] px-3 py-2 text-[var(--fg)] transition-colors hover:bg-[#f2a889] hover:text-[var(--bg)]"
                >
                  {world.host.label} · {world.host.talk}
                </button>
              </li>
            ) : null}
            {payload.guides
              .filter((one) => one.zone === tourZone)
              .map((one) => (
                <li key={one.id}>
                  <button
                    type="button"
                    onClick={() => onTalk(one)}
                    className="mono-label -my-1 border border-[var(--accent)] px-3 py-2 text-[var(--fg)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)]"
                  >
                    {one.askText}
                  </button>
                </li>
              ))}
            {payload.displays
              .filter(
                (one) =>
                  one.zone === tourZone && !districtNames.has(one.content.title.toLowerCase()),
              )
              /* One chip per name: a district with an immersive wall and a
                 terminal for the same product offered it twice. */
              .filter(
                (one, index, all) =>
                  all.findIndex((other) => other.content.title === one.content.title) === index,
              )
              .slice(0, 6)
              .map((one) => (
                <li key={one.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(one)}
                    className="mono-label -my-1 border border-[var(--line-strong)] px-3 py-2 text-[var(--fg-dim)] transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                  >
                    {one.content.title}
                  </button>
                </li>
              ))}
          </ul>
          <nav aria-label="Archon World" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {ZONES.map((one) => (
              <button
                key={one.id}
                type="button"
                onClick={() => onTour(one.id)}
                aria-current={one.id === tourZone ? "true" : undefined}
                className={cn(
                  "mono-label -my-2 py-2 transition-colors",
                  one.id === tourZone ? "text-[var(--fg)]" : "text-[var(--fg-mute)]",
                )}
              >
                {t(one.label, locale)}
              </button>
            ))}
          </nav>
          <p className="mono-micro text-[var(--fg-mute)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {seen.complete
              ? payload.copy.foundAll
              : `${pad(seen.found)} / ${pad(seen.total)} ${payload.copy.found}`}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * What opens when you press E on a panel.
 */
export function Detail({
  display,
  copy,
  onClose,
}: {
  display: PreparedDisplay;
  copy: WorldPayload["copy"];
  onClose: () => void;
}) {
  useEffect(() => {
    blip(520, 0.09, 0.05);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const { content } = display;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      className="pointer-events-none absolute inset-0 z-[136] flex items-end"
    >
      <div className="frame w-full pb-14">
        <div
          className="pointer-events-auto max-w-[36rem] border border-[var(--line)] p-6 [animation:route-enter_420ms_var(--ease-out-expo)_both] md:p-7"
          style={{
            ["--accent" as string]: content.accent,
            background: "linear-gradient(180deg, rgba(20,34,66,0.78), rgba(8,14,30,0.86))",
            backdropFilter: "blur(10px)",
            borderRadius: "var(--radius-hair)",
            boxShadow: "0 0 0 1px rgba(154,214,255,0.08), 0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          <p className="mono-micro flex flex-wrap items-center gap-3 text-[var(--accent)]">
            <span>{content.eyebrow}</span>
            {content.provenance ? (
              <span className="border border-[var(--accent)] px-2 py-1">{content.provenance}</span>
            ) : null}
          </p>

          <h2 className="mt-3 text-sub">{content.title}</h2>
          <p className="mt-3 text-[var(--fg-dim)]">{content.body}</p>

          {content.layers?.length ? (
            <ul className="mt-5 flex flex-col gap-2 border-l border-[var(--line)] pl-5">
              {content.layers.map((layer) => (
                <li key={layer.label}>
                  <span className="mono-micro text-[var(--fg)]">{layer.label}</span>
                  <span className="ml-3 text-[var(--fg-mute)]">{layer.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {content.meta?.length ? (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
              {content.meta.map((item) => (
                <li key={item} className="mono-micro text-[var(--fg-mute)]">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
            {display.href ? (
              <Link
                href={display.href}
                className="mono-label link-rule inline-flex items-center gap-3 text-[var(--fg)]"
              >
                {display.action}
                <span aria-hidden="true" className="block h-px w-8 bg-current" />
              </Link>
            ) : null}
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mono-label link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              ← {copy.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * What opens when you ask a guide about a project.
 *
 * The project's own words — its category, its statement, its standfirst and
 * its verified facts — set as a small panel over the world, and read aloud by
 * the browser if the visitor has switched the voice on. The transcript is
 * always there; the voice is a rendering of it, with play, pause and replay.
 * The way on to the real case study is the one line at the end.
 */
export function Conversation({
  guide,
  copy,
  locale,
  onClose,
}: {
  guide: PreparedGuide;
  copy: WorldPayload["copy"];
  locale: Locale;
  onClose: () => void;
}) {
  const voice = useSyncExternalStore(voiceStore.subscribe, voiceStore.get, () => NO_VOICE);
  const lang = locale === "tr" ? "tr-TR" : "en-GB";
  const reading = voice.current === guide.id;

  useEffect(() => {
    blip(560, 0.09, 0.05);
    discovery.find(`${guide.id}:explained`);
    guideStore.talking = guide.id;
    if (voiceStore.get().enabled) voiceStore.speak(guide.id, guide.voiceText, lang);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      guideStore.talking = null;
      voiceStore.stop();
    };
  }, [guide, lang, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={guide.name}
      data-conversation={guide.projectId}
      className="pointer-events-none absolute inset-0 z-[136] flex items-end justify-end"
    >
      <div className="frame flex w-full justify-end pb-14">
        <div
          className="pointer-events-auto w-full max-w-[26rem] border border-[var(--line)] p-6 [animation:route-enter_420ms_var(--ease-out-expo)_both]"
          style={{
            ["--accent" as string]: guide.accent,
            background: "linear-gradient(180deg, rgba(20,34,66,0.8), rgba(8,14,30,0.88))",
            backdropFilter: "blur(12px)",
            borderRadius: "var(--radius-hair)",
            boxShadow: "0 0 0 1px rgba(154,214,255,0.08), 0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* A hairline of the project's colour across the top: the plate
              belongs to the station it floats beside. */}
          <span aria-hidden="true" className="block h-px w-12 bg-[var(--accent)]" />
          <h2 className="mt-4 text-head leading-none">{guide.name}</h2>
          <p className="mono-micro mt-2 text-[var(--accent)]">{guide.category}</p>

          <p className="text-quote mt-5">{guide.statement}</p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--fg-dim)]" data-transcript>
            {guide.body}
          </p>

          {/* The voice: one small row. Nothing plays until it is asked to. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-3 items-end gap-[2px]",
                reading && voice.speaking && !voice.paused ? "opacity-100" : "opacity-35",
              )}
            >
              {[3, 6, 10, 7, 4, 8, 5].map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "block w-[2px] bg-[var(--accent)]",
                    reading && voice.speaking && !voice.paused && "animate-pulse",
                  )}
                  style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </span>
            {!voice.supported ? (
              <span className="mono-micro text-[var(--fg-mute)]">{copy.transcript}</span>
            ) : !voice.enabled ? (
              <button
                type="button"
                onClick={() => {
                  voiceStore.enable(true);
                  voiceStore.speak(guide.id, guide.voiceText, lang);
                }}
                className="mono-micro link-rule text-[var(--fg)]"
              >
                {copy.voiceOn}
              </button>
            ) : (
              <>
                {reading && voice.speaking && !voice.paused ? (
                  <button type="button" onClick={() => voiceStore.pause()} className="mono-micro link-rule text-[var(--fg)]">
                    {copy.pause}
                  </button>
                ) : reading && voice.paused ? (
                  <button type="button" onClick={() => voiceStore.resume()} className="mono-micro link-rule text-[var(--fg)]">
                    {copy.play}
                  </button>
                ) : (
                  <button type="button" onClick={() => voiceStore.speak(guide.id, guide.voiceText, lang)} className="mono-micro link-rule text-[var(--fg)]">
                    {copy.play}
                  </button>
                )}
                <button type="button" onClick={() => voiceStore.speak(guide.id, guide.voiceText, lang)} className="mono-micro link-rule text-[var(--fg-mute)] hover:text-[var(--fg)]">
                  {copy.replay}
                </button>
                <button type="button" onClick={() => voiceStore.enable(false)} className="mono-micro link-rule text-[var(--fg-mute)] hover:text-[var(--fg)]">
                  {copy.voiceOff}
                </button>
              </>
            )}
          </div>

          <dl className="hairline-t mt-5">
            {guide.facts.map((fact) => (
              <div key={fact.label} className="hairline-b flex justify-between gap-6 py-2">
                <dt className="mono-micro text-[var(--fg-mute)]">{fact.label}</dt>
                <dd className="text-right text-[0.875rem] text-[var(--fg-dim)]">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <Link
              href={guide.href}
              onClick={() => discovery.find(`entered:${guide.projectId}`)}
              className="mono-label link-rule group inline-flex items-center gap-3 text-[var(--fg)]"
            >
              {copy.explore}
              <span aria-hidden="true" className="block h-px w-8 bg-current transition-[width] duration-500 group-hover:w-14" />
            </Link>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mono-micro link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              ← {copy.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * The host's conversation.
 *
 * The first time: the introduction, four short lines, spoken if the voice is
 * on and always written. After that: a welcome back. Then the two things she
 * can do — come along, or stay — and the way out. The world stays visible.
 */
export function HostCard({
  world,
  copy,
  locale,
  onClose,
}: {
  world: WorldCopy;
  copy: WorldPayload["copy"];
  locale: Locale;
  onClose: () => void;
}) {
  const host = useSyncExternalStore(hostStore.subscribe, hostStore.get, () => NO_HOST);
  const voice = useSyncExternalStore(voiceStore.subscribe, voiceStore.get, () => NO_VOICE);
  const [returning] = useState(() => hostStore.seen());
  const lines = useMemo(() => (returning ? [world.host.back] : world.host.intro), [returning, world.host.back, world.host.intro]);
  const text = `${lines.join(" ")} ${world.host.question}`;
  /* What she can do for the visitor: take them somewhere, or come along. */
  const choose = (option: "projects" | "tour" | "gallery" | "systems") => {
    if (option === "tour") hostStore.set({ following: true });
    else {
      teleportStore.request(option === "projects" ? "meetzy" : option);
      hostStore.set({ following: true });
    }
    onClose();
  };
  const reading = voice.current === "host";

  useEffect(() => {
    hostStore.markSeen();
    /* She is the one speaking: her mouth moves, the explorer attends. */
    guideStore.talking = "host";
    if (voiceStore.get().enabled) voiceStore.speak("host", text, locale);
    return () => {
      voiceStore.stop();
      if (guideStore.talking === "host") guideStore.talking = null;
    };
  }, [locale, text]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={world.host.label}
      data-host-card
      className="pointer-events-none absolute inset-0 z-[136] flex items-end justify-end"
    >
      <div className="frame flex w-full justify-end pb-14">
        <div
          className="pointer-events-auto w-full max-w-[26rem] border border-[rgba(255,244,232,0.18)] p-6 [animation:route-enter_420ms_var(--ease-out-expo)_both]"
          style={{
            ["--accent" as string]: "#f2a889",
            background: "linear-gradient(180deg, rgba(20,34,66,0.72), rgba(8,14,30,0.84))",
            backdropFilter: "blur(12px)",
            borderRadius: "var(--radius-hair)",
            boxShadow: "0 0 0 1px rgba(242,168,137,0.08), 0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          <span aria-hidden="true" className="block h-px w-12 bg-[var(--accent)]" />
          <p className="mono-micro mt-4 text-[var(--accent)]">{world.host.label}</p>
          <div className="mt-4 flex flex-col gap-3" data-transcript>
            {lines.map((line, i) => (
              <p
                key={line}
                className={cn(i === 0 ? "text-quote" : "text-[0.9375rem] leading-relaxed text-[var(--fg-dim)]")}
              >
                {line}
              </p>
            ))}
            <p className="text-[0.9375rem] leading-relaxed text-[var(--fg)]">{world.host.question}</p>
          </div>

          {/* Her offer: four ways in. */}
          <ul className="mt-4 grid grid-cols-2 gap-2" data-host-options>
            {(["projects", "tour", "gallery", "systems"] as const).map((option) => (
              <li key={option}>
                <button
                  type="button"
                  data-host-option={option}
                  onClick={() => choose(option)}
                  className="mono-micro w-full border border-[rgba(255,244,232,0.18)] px-3 py-2 text-left text-[var(--fg-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg)]"
                >
                  {world.host.options[option]}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span
              aria-hidden="true"
              className={cn("flex h-3 items-end gap-[2px]", reading && voice.speaking && !voice.paused ? "opacity-100" : "opacity-35")}
            >
              {[3, 6, 10, 7, 4, 8, 5].map((h, i) => (
                <span
                  key={i}
                  className={cn("block w-[2px] bg-[var(--accent)]", reading && voice.speaking && !voice.paused && "animate-pulse")}
                  style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </span>
            {!voice.supported ? (
              <span className="mono-micro text-[var(--fg-mute)]">{copy.transcript}</span>
            ) : !voice.enabled ? (
              <button
                type="button"
                onClick={() => {
                  voiceStore.enable(true);
                  voiceStore.speak("host", text, locale);
                }}
                className="mono-micro link-rule text-[var(--fg)]"
              >
                {copy.voiceOn}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => voiceStore.speak("host", text, locale)} className="mono-micro link-rule text-[var(--fg)]">
                  {copy.replay}
                </button>
                <button type="button" onClick={() => voiceStore.enable(false)} className="mono-micro link-rule text-[var(--fg-mute)] hover:text-[var(--fg)]">
                  {copy.voiceOff}
                </button>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <button
              type="button"
              data-host-follow
              onClick={() => {
                hostStore.set({ following: !host.following });
                onClose();
              }}
              className="mono-label link-rule group inline-flex items-center gap-3 text-[var(--fg)]"
            >
              {host.following ? world.host.stay : world.host.follow}
              <span aria-hidden="true" className="block h-px w-8 bg-current transition-[width] duration-500 group-hover:w-14" />
            </button>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mono-micro link-rule -my-2 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              {world.host.thanks}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Touch controls.
 *
 * A look layer over the whole frame: any finger that is not on a control
 * turns the camera by how far it moves. A stick at the bottom left — a base
 * and a knob, analog, dead-zoned, running at the rim — that follows the
 * finger and snaps back the instant it lifts. A jump button at the bottom
 * right, one jump per press. All three work at once: every finger is its own
 * pointer, the stick and the button capture theirs, and the look layer
 * ignores any pointer that began on a control. Safe-area insets keep both
 * controls clear of the home indicator and the corners.
 */
function TouchControls({ jumpLabel }: { jumpLabel: string }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const stickPointer = useRef<number | null>(null);
  const lookPointers = useRef(new Map<number, { x: number; y: number }>());
  const RADIUS = 46;

  useEffect(() => {
    touchInput.active = true;
    return () => {
      touchInput.active = false;
      touchInput.x = 0;
      touchInput.y = 0;
    };
  }, []);

  const setStick = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    const mag = Math.min(1, len / RADIUS);
    /* A dead zone in the middle, so a resting thumb does not creep; from
       there the magnitude is linear to the rim. The pace curve and the run
       threshold live in the walking loop, which reads this once a frame. */
    const live = mag < 0.1 ? 0 : (mag - 0.1) / 0.9;
    const nx = len > 1e-6 ? dx / len : 0;
    const ny = len > 1e-6 ? dy / len : 0;
    touchInput.x = nx * live;
    touchInput.y = -ny * live;
    if (base.current) base.current.dataset.live = live > 0.93 ? "run" : live > 0 ? "walk" : "";
  };
  const releaseStick = () => {
    stickPointer.current = null;
    touchInput.x = 0;
    touchInput.y = 0;
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
    if (base.current) base.current.dataset.live = "";
  };

  return (
    <>
      {/* The look layer. */}
      <div
        data-touch-look
        className="pointer-events-auto absolute inset-0 -z-10"
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          lookPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }}
        onPointerMove={(event) => {
          const last = lookPointers.current.get(event.pointerId);
          if (!last) return;
          touchInput.lookDx += event.clientX - last.x;
          touchInput.lookDy += event.clientY - last.y;
          lookPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }}
        onPointerUp={(event) => lookPointers.current.delete(event.pointerId)}
        onPointerCancel={(event) => lookPointers.current.delete(event.pointerId)}
      />
      {/* The stick: a glass dial with a tick ring, a rim that lights when
          the thumb reaches it, and a knob that follows the thumb. */}
      <div
        ref={base}
        data-joystick
        className="group pointer-events-auto absolute z-10 flex size-[128px] items-center justify-center rounded-full border border-[rgba(255,244,232,0.26)] bg-[radial-gradient(circle_at_50%_40%,rgba(28,44,78,0.55),rgba(8,14,28,0.5))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
        style={{
          left: "calc(env(safe-area-inset-left) + 1.25rem)",
          bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
          touchAction: "none",
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          if (stickPointer.current !== null) return;
          stickPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          setStick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== stickPointer.current) return;
          setStick(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (event.pointerId === stickPointer.current) releaseStick();
        }}
        onPointerCancel={(event) => {
          if (event.pointerId === stickPointer.current) releaseStick();
        }}
        onLostPointerCapture={releaseStick}
      >
        {/* The tick ring, and the rim that lights at a run. */}
        <span
          aria-hidden="true"
          className="absolute inset-[7px] rounded-full opacity-60"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,244,232,0.42) 0deg 1.6deg, transparent 1.6deg 15deg)",
            WebkitMask: "radial-gradient(circle, transparent 54px, #000 55px)",
            mask: "radial-gradient(circle, transparent 54px, #000 55px)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-transparent transition-colors duration-150 group-data-[live=run]:border-[rgba(94,230,255,0.75)] group-data-[live=run]:shadow-[0_0_18px_rgba(94,230,255,0.35)]"
        />
        <span aria-hidden="true" className="absolute inset-[22px] rounded-full border border-[rgba(255,244,232,0.12)]" />
        {/* Cardinal marks. */}
        {[0, 90, 180, 270].map((deg) => (
          <span
            key={deg}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[7px] w-[2px] -translate-x-1/2 rounded bg-[rgba(255,244,232,0.5)]"
            style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-50px)` }}
          />
        ))}
        <div
          ref={knob}
          className="relative size-[52px] rounded-full border border-[rgba(154,214,255,0.7)] bg-[radial-gradient(circle_at_50%_35%,rgba(154,214,255,0.42),rgba(154,214,255,0.12)_70%)] shadow-[0_0_16px_rgba(94,230,255,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-75 group-data-[live=run]:border-[rgba(94,230,255,1)] group-data-[live=run]:shadow-[0_0_22px_rgba(94,230,255,0.6),inset_0_1px_0_rgba(255,255,255,0.35)]"
        >
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 size-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(234,252,255,0.9)]" />
        </div>
      </div>
      {/* The jump button: a glass disc with a chevron and the word. */}
      <button
        type="button"
        data-jump
        aria-label={jumpLabel}
        className="group pointer-events-auto absolute z-10 flex size-[80px] flex-col items-center justify-center gap-0.5 rounded-full border border-[rgba(255,244,232,0.3)] bg-[radial-gradient(circle_at_50%_35%,rgba(28,44,78,0.6),rgba(8,14,28,0.55))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[transform,box-shadow] duration-100 active:scale-95 active:border-[rgba(94,230,255,0.9)] active:shadow-[0_0_22px_rgba(94,230,255,0.45)]"
        style={{
          right: "calc(env(safe-area-inset-right) + 1.25rem)",
          bottom: "calc(env(safe-area-inset-bottom) + 1.75rem)",
          touchAction: "none",
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          touchInput.jump = true;
        }}
      >
        <span aria-hidden="true" className="absolute inset-[6px] rounded-full border border-[rgba(255,244,232,0.12)]" />
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 14l6-6 6 6" />
          <path d="M6 19l6-6 6 6" opacity="0.45" />
        </svg>
        <span className="mono-micro text-[var(--fg)]">{jumpLabel}</span>
      </button>
    </>
  );
}
