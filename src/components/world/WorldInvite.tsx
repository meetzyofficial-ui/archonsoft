"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import gate from "@/assets/world/gate.jpg";
import { openWorld } from "@/components/world/openWorld";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The way in, from anywhere on the ordinary site.
 *
 * Two shapes of the same thing: a line in the navigation and the button at the
 * end of the invitation band. Both do the same three jobs — forget that the
 * world was dismissed, go to the page the world lives on if we are not already
 * there, and ask it to open.
 *
 * It renders nothing at all on a machine that cannot run the world. An
 * invitation into somewhere the visitor's browser cannot go is worse than no
 * invitation, and this is the only place that check needs to live because
 * every entry point comes through here.
 */
export function useWebGL(): boolean {
  const [able, setAble] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setAble(
        Boolean(
          window.WebGLRenderingContext &&
            (canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
        ),
      );
    } catch {
      setAble(false);
    }
  }, []);
  return able;
}

/** The world's code, fetched ahead: on intent, and once the page is idle. */
let fetched = false;
export function preloadWorld() {
  if (fetched) return;
  fetched = true;
  void import("@/components/world/WorldScene");
}

export function useEnterWorld(locale: Locale) {
  const router = useRouter();
  return useCallback(
    (event?: { preventDefault: () => void }) => {
      event?.preventDefault();
      /* On the home page the gate is already listening. From anywhere else the
         event still reaches it, since it lives in the layout, and the push
         brings the page it shows on. */
      openWorld();
      if (window.location.pathname !== localePath(locale)) router.push(localePath(locale));
    },
    [locale, router],
  );
}

export function WorldNavLink({
  locale,
  label,
  className,
  index,
  labelClassName,
  onClick,
  tabIndex,
  style,
}: {
  locale: Locale;
  label: string;
  className?: string;
  /** Set when the label has to match the type of the list it sits in. */
  labelClassName?: string;
  /** The mono index the index list prints beside every other entry. */
  index?: string;
  /** The mobile menu has to close itself on the way through. */
  onClick?: () => void;
  tabIndex?: number;
  style?: CSSProperties;
}) {
  const enter = useEnterWorld(locale);
  const able = useWebGL();
  if (!able) return null;

  return (
    <a
      href={`${localePath(locale)}?world`}
      tabIndex={tabIndex}
      style={style}
      onClick={(event) => {
        onClick?.();
        enter(event);
      }}
      data-world-trigger=""
      className={className}
    >
      {index ? (
        <span
          className="mono-micro w-7 shrink-0 self-start pt-3 text-[var(--fg-mute)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {index}
        </span>
      ) : null}
      <span className={labelClassName}>{label}</span>
    </a>
  );
}

export function WorldEnterButton({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const enter = useEnterWorld(locale);
  const able = useWebGL();
  if (!able) return null;

  return (
    <a
      href={`${localePath(locale)}?world`}
      onClick={enter}
      data-world-trigger=""
      className={cn("btn-raised btn-world", className)}
    >
      {label}
      <span aria-hidden="true" className="arrow-rule" />
    </a>
  );
}

/** The way in, as the loudest thing in the header. */
export function WorldHeaderButton({
  locale,
  label,
  shortLabel,
}: {
  locale: Locale;
  label: string;
  shortLabel: string;
}) {
  const enter = useEnterWorld(locale);
  const able = useWebGL();
  useEffect(() => {
    /* Not on a metered or slow line: there it waits for the pointer. */
    const line = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (line?.saveData || (line?.effectiveType && line.effectiveType !== "4g")) return;
    const timer = window.setTimeout(preloadWorld, 3500);
    return () => window.clearTimeout(timer);
  }, []);
  if (!able) return null;
  return (
    <a
      href={`${localePath(locale)}?world`}
      onClick={enter}
      onPointerEnter={preloadWorld}
      onTouchStart={preloadWorld}
      data-world-trigger=""
      aria-label={label}
      className="world-block group"
    >
      <Image src={gate} alt="" sizes="84px" className="world-block__shot" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      <span aria-hidden="true" className="arrow-rule" />
    </a>
  );
}
