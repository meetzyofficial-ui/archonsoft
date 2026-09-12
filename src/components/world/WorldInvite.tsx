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

  /* The old control was a 52px bordered box with a hover fill — the one
     button-shaped object left on the site. What opens a world is a line and
     an arrow, at the same eleven pixels as every other thing you can do
     here; the size of the invitation is not what makes it worth taking. */
  return (
    <a
      href={localePath(locale)}
      onClick={enter}
      className={cn(
        "mono-label link-rule group/enter inline-flex items-center gap-4 text-[var(--fg)]",
        className,
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className="relative block h-px w-12 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/enter:w-20"
      >
        <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
      </span>
    </a>
  );
}
