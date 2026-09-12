"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArchonWorld } from "@/components/world/ArchonWorld";
import type { Copy } from "@/i18n/dictionary";
import type { Locale } from "@/lib/i18n";
import { OPEN_WORLD_EVENT, WORLD_DISMISSED_KEY } from "@/components/world/openWorld";
import type { WorldPayload } from "@/lib/worldPayload";

export type WorldCopy = Copy["world"];

/**
 * Decides whether Archon World opens, how, and gives it a way back in.
 *
 * The world is an experience layer, never a gate in the other sense: the site
 * underneath is complete without it, and this component's whole job is to make
 * sure nobody is ever on the wrong side of it. It opens once per session, it
 * closes on Escape or on "Main site", and once closed it leaves a single quiet
 * control to open it again.
 *
 * Two things stop it opening at all — no WebGL, or a visitor who has already
 * dismissed it — and in both cases the ordinary home page is simply what
 * loads, which is why none of this needed a fallback design of its own.
 */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * How the visitor drives.
 *
 * A keyboard and a mouse that can be captured walk the world directly. A
 * touch screen walks it too, through an on-screen stick, a look-drag and a
 * jump button; it also gets the compact scene — fewer people, a lower pixel
 * ratio, staged construction — because the device is smaller in every
 * sense. The guided tour survives for the visitor who has asked for reduced
 * motion on a touch device.
 */
function pickInput(): { touch: boolean; compact: boolean } {
  if (typeof window === "undefined") return { touch: true, compact: true };
  const fine = window.matchMedia?.("(pointer: fine)").matches;
  const wide = window.innerWidth >= 1024;
  const touch = !(fine && wide);
  return { touch, compact: touch || window.innerWidth < 900 };
}

export function WorldGate({
  locale,
  copies,
  payloads,
}: {
  locale: Locale;
  copies: Record<Locale, WorldCopy>;
  payloads: Record<Locale, WorldPayload>;
}) {
  const copy = copies[locale];
  const pathname = usePathname();
  /* The world belongs to the home page. Mounting from the layout is what makes
     it fixed from the first frame; this is what keeps it off every other
     route. */
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  const [open, setOpen] = useState(true);
  const [available, setAvailable] = useState(true);
  const [input, setInput] = useState<{ touch: boolean; compact: boolean }>({ touch: true, compact: true });

  useEffect(() => {
    const capable = hasWebGL();
    setAvailable(capable);
    setInput(pickInput());

    /* `/world` redirects here asking for the world. Somebody who typed that
       address, or followed a link to it, has already said what they want —
       so it outranks a dismissal from earlier in the session. */
    let asked = false;
    try {
      asked = new URLSearchParams(window.location.search).has("world");
    } catch {
      asked = false;
    }

    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(WORLD_DISMISSED_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if ((dismissed && !asked) || !capable) setOpen(false);
  }, []);

  const close = useCallback(() => {
    try {
      window.sessionStorage.setItem(WORLD_DISMISSED_KEY, "1");
    } catch {
      /* A private window simply reopens the world next time. */
    }
    setOpen(false);
  }, []);

  const reopen = useCallback(() => setOpen(true), []);

  /* Anywhere on the site can ask for the world back — the invitation band, the
     navigation, the control this leaves behind. They all end up here, because
     the visitor may already be standing on the home page and there is then no
     navigation for React to react to. */
  useEffect(() => {
    const onAsk = () => setOpen(true);
    window.addEventListener(OPEN_WORLD_EVENT, onAsk);
    return () => window.removeEventListener(OPEN_WORLD_EVENT, onAsk);
  }, []);

  if (!isHome) return null;

  if (open) {
    return (
      <ArchonWorld locale={locale} copies={copies} payloads={payloads} touch={input.touch} compact={input.compact} onExit={close} />
    );
  }

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={reopen}
      className="mono-micro fixed right-[var(--spacing-gutter)] bottom-5 z-[110] hidden cursor-pointer items-center gap-3 text-[var(--fg-mute)] transition-colors duration-500 hover:text-[var(--fg)] sm:inline-flex"
    >
      {copy.enterShort}
      <span aria-hidden="true" className="block h-px w-6 bg-current" />
    </button>
  );
}
