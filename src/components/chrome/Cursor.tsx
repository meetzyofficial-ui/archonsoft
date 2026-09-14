"use client";

import { useEffect, useRef, useState } from "react";
import { useHasPointer, usePrefersReducedMotion } from "@/lib/hooks";
import { useWorldOpen } from "@/lib/worldOpen";

const INTERACTIVE = 'a[href], button, [role="button"], [role="tab"], summary, label[for], select, [data-cursor]';
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="range"]), textarea, [contenteditable="true"]';

type CursorState = { active: boolean; label: string | null; text: boolean };

/** What a target will do, in a word — its own label first, then its kind. */
function labelFor(target: HTMLElement, lang: string): string | null {
  const own = target.closest<HTMLElement>("[data-cursor-label]")?.dataset.cursorLabel;
  if (own) return own;
  const tr = lang.startsWith("tr");
  if (target.closest("[data-world-trigger]")) return tr ? "Dünyaya gir" : "Enter world";
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return null;
  const href = link.getAttribute("href") ?? "";
  if (/\/projects\/[^/?#]+/.test(href)) return tr ? "İncele" : "Explore";
  if (/\/labs\/[^/?#]+/.test(href)) return tr ? "Keşfet" : "Explore";
  if (link.target === "_blank" || /^https?:\/\//.test(href)) return tr ? "Aç" : "Open";
  return null;
}

/**
 * The pointer is the robot.
 *
 * A small head in the Archon robot's own language — dark titanium, a black
 * visor, two cyan eyes — that sits exactly where the pointer is. It replaces
 * the native arrow on a desktop, so it is placed without lag: a cursor that
 * trails is a cursor you cannot aim. What is allowed to trail is the faint
 * light around it.
 *
 * Over anything that does something it leans in: the head grows a little, the
 * eyes brighten, and where the target has a verb — a project to explore, the
 * world to enter, a link that leaves — the verb appears beside it. A press
 * compresses it for ninety milliseconds and sends one ring of light out.
 *
 * It is only ever a visual layer. It never takes a pointer event, text fields
 * keep the native I-beam (the head steps away while one is under the
 * pointer), a touch device never mounts it, reduced motion keeps it but
 * drops every animation, and while Archon World is open it is gone and the
 * native cursor is back — the world has its own.
 */
export function Cursor() {
  const hasPointer = useHasPointer();
  const reduced = usePrefersReducedMotion();
  const worldOpen = useWorldOpen();
  const head = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>({ active: false, label: null, text: false });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(0);
  /* The verb stays written while it fades out, rather than vanishing first. */
  const lastLabel = useRef<string | null>(null);
  if (state.label) lastLabel.current = state.label;

  const enabled = hasPointer && !worldOpen;

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("robot-cursor-on");
    return () => root.classList.remove("robot-cursor-on");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const headNode = head.current;
    const haloNode = halo.current;
    if (!headNode || !haloNode) return;

    const root = document.documentElement;
    const pointer = { x: -100, y: -100 };
    const trail = { x: -100, y: -100 };
    let frame = 0;
    let seen = false;
    let dirty = true;

    const place = () => {
      frame = 0;
      headNode.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      if (reduced) {
        trail.x = pointer.x;
        trail.y = pointer.y;
      } else {
        trail.x += (pointer.x - trail.x) * 0.2;
        trail.y += (pointer.y - trail.y) * 0.2;
      }
      haloNode.style.transform = `translate3d(${trail.x.toFixed(1)}px, ${trail.y.toFixed(1)}px, 0)`;
      const settling = Math.abs(pointer.x - trail.x) + Math.abs(pointer.y - trail.y) > 0.3;
      if (dirty || settling) {
        dirty = false;
        frame = requestAnimationFrame(place);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!seen) {
        seen = true;
        trail.x = pointer.x;
        trail.y = pointer.y;
        setVisible(true);
      }
      dirty = true;
      if (!frame) frame = requestAnimationFrame(place);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest) return;
      const text = Boolean(target.closest(TEXT_ENTRY));
      const interactive = target.closest<HTMLElement>(INTERACTIVE);
      const label = interactive ? labelFor(interactive, root.lang || "en") : null;
      setState((previous) =>
        previous.active === Boolean(interactive) && previous.label === label && previous.text === text
          ? previous
          : { active: Boolean(interactive), label, text },
      );
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      setPressed((n) => n + 1);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => {
      if (seen) setVisible(true);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerenter", onEnter);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;

  const shown = visible && !state.text;

  return (
    <div
      aria-hidden="true"
      data-cursor-root=""
      data-state={state.active ? "hover" : "idle"}
      data-reduced={reduced ? "true" : "false"}
      className="robot-cursor"
      style={{ opacity: shown ? 1 : 0 }}
    >
      <div ref={halo} className="robot-cursor__halo" />
      <div ref={head} className="robot-cursor__anchor">
        {/* Keyed on the press count so each press restarts the reaction. */}
        <div key={pressed} className="robot-cursor__head" data-pressed={pressed > 0 ? "true" : "false"}>
          <span className="robot-cursor__ring" />
          <svg viewBox="0 0 40 40" width="30" height="30" className="robot-cursor__svg">
            <defs>
              <linearGradient id="robot-cursor-shell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3a4250" />
                <stop offset="0.45" stopColor="#1b2029" />
                <stop offset="1" stopColor="#090b10" />
              </linearGradient>
              <linearGradient id="robot-cursor-lip" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Antenna, with the one light it carries. */}
            <line x1="20" y1="4.5" x2="20" y2="9" stroke="#4b5462" strokeWidth="1.4" strokeLinecap="round" />
            <circle className="robot-cursor__beacon" cx="20" cy="3.6" r="1.6" fill="#62d8ff" />
            {/* Ear plates. */}
            <rect x="3.6" y="16.5" width="4" height="8" rx="1.4" fill="#141922" stroke="#2c3440" strokeWidth="0.6" />
            <rect x="32.4" y="16.5" width="4" height="8" rx="1.4" fill="#141922" stroke="#2c3440" strokeWidth="0.6" />
            {/* The shell. */}
            <rect x="7" y="8.6" width="26" height="24" rx="8.4" fill="url(#robot-cursor-shell)" stroke="#4a5362" strokeWidth="0.8" />
            <rect x="11" y="9.3" width="18" height="0.9" rx="0.45" fill="url(#robot-cursor-lip)" />
            {/* Visor. */}
            <rect x="9.8" y="14.6" width="20.4" height="10.2" rx="5" fill="#04060a" stroke="#62d8ff" strokeOpacity="0.32" strokeWidth="0.7" />
            {/* Eyes. */}
            <g className="robot-cursor__eyes">
              <rect x="13.4" y="18.2" width="5" height="2.8" rx="1.4" fill="#62d8ff" />
              <rect x="21.6" y="18.2" width="5" height="2.8" rx="1.4" fill="#62d8ff" />
            </g>
            {/* Jaw vents. */}
            <g stroke="#3a4250" strokeWidth="0.9" strokeLinecap="round">
              <line x1="16" y1="28.4" x2="16" y2="30.2" />
              <line x1="20" y1="28.4" x2="20" y2="30.2" />
              <line x1="24" y1="28.4" x2="24" y2="30.2" />
            </g>
          </svg>
        </div>
        <span className="robot-cursor__label mono-micro" data-shown={state.label ? "true" : "false"}>
          {state.label ?? lastLabel.current}
        </span>
      </div>
    </div>
  );
}
