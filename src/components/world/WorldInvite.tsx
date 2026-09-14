"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
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
function useWebGL(): boolean {
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

export function useEnterWorld(locale: Locale) {
  const router = useRouter();
  return useCallback(
    (event?: { preventDefault: () => void }) => {
      event?.preventDefault();
      openWorld();
      /* `push` on the page you are already on is a no-op in Next, which is
         exactly what we want: the event above has already told the gate. */
      router.push(localePath(locale));
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
      href={localePath(locale)}
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

  /* The one control on the site with light of its own — the same raised
     surface as every other action, with a cyan edge and an eye. */
  return (
    <a
      href={localePath(locale)}
      onClick={enter}
      data-world-trigger=""
      className={cn("btn-raised btn-world mono-label", className)}
    >
      <span aria-hidden="true" className="btn-world__eye" />
      {label}
      <span aria-hidden="true" className="arrow-rule" />
    </a>
  );
}

/**
 * The way in, at the centre of the header.
 *
 * Centred because it is the one thing the header offers that no other site
 * does, and raised because it is the only control that leaves the document.
 * On a phone the label shortens to one word and the eye stays.
 */
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
  if (!able) return null;
  return (
    <a
      href={localePath(locale)}
      onClick={enter}
      data-world-trigger=""
      aria-label={label}
      className="btn-raised btn-world mono-label !min-h-[2.375rem] !gap-2.5 !px-3.5 !py-2 sm:!px-4"
    >
      <span aria-hidden="true" className="btn-world__eye" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </a>
  );
}
