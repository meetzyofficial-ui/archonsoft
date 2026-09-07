"use client";

import { useState } from "react";
import { Icon } from "@/components/labs/Icon";
import { STACK_SPINE, type StackNotes } from "@/data/labs/stories";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Opening a product to see what is under it.
 *
 * Everything on this site argues that Archon does not stop at the frontend,
 * and that argument is normally made with a box-and-arrow diagram nobody
 * reads. This makes it an object instead: the interface is the top plane of a
 * stack, and the six layers that actually carry it are underneath, separated
 * in space so you can see there is something there.
 *
 * The planes are decoration and are hidden from assistive technology; the
 * column beside them is the real content, and it reads as a list with or
 * without the scene. That split is what lets the drawing be as three-
 * dimensional as it likes without costing anything in accessibility.
 *
 * Mechanically it is one rotated container and seven `translateZ` values. No
 * canvas, no library, and one transform per layer on the whole interaction.
 */
export function SystemStack({
  locale,
  notes,
  accent,
  label,
  openLabel,
  closeLabel,
  productName,
  className,
}: {
  locale: Locale;
  /** Per-product overrides. Layers without one fall back to the generic line. */
  notes: StackNotes;
  accent: string;
  label: string;
  openLabel: string;
  closeLabel: string;
  productName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  return (
    <div
      style={{ ["--accent" as string]: accent }}
      className={cn("grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12", className)}
    >
      {/* The object. */}
      <div className="lg:col-span-6">
        <div className="stack-scene relative mx-auto aspect-[5/4] w-full max-w-[34rem]">
          <div
            aria-hidden="true"
            data-open={open ? "true" : "false"}
            className="stack-deck absolute inset-[2%_6%_24%_6%]"
          >
            {STACK_SPINE.map((layer, index) => {
              const depth = STACK_SPINE.length - 1 - index;
              const lifted = active === layer.id;
              return (
                <div
                  key={layer.id}
                  style={{ ["--depth" as string]: String(depth) }}
                  data-lifted={lifted ? "true" : "false"}
                  className={cn(
                    "stack-plane absolute inset-0 rounded-[3px] border transition-[transform,border-color,background-color] duration-[700ms] ease-[var(--ease-out-expo)]",
                    index === 0
                      ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_22%,var(--color-ink))]"
                      : lifted
                        ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,var(--color-ink))]"
                        : "border-[var(--line-strong)] bg-[color-mix(in_oklab,var(--color-paper)_5%,var(--color-ink))]",
                  )}
                >
                  {/* The top plane is the interface, so it carries the only
                      thing that looks like an interface. */}
                  {index === 0 ? (
                    <span className="absolute inset-2 flex flex-col gap-1.5 opacity-70">
                      <span className="h-1.5 w-1/3 rounded-full bg-[var(--accent)]" />
                      <span className="h-1 w-full rounded-full bg-white/25" />
                      <span className="h-1 w-4/5 rounded-full bg-white/20" />
                      <span className="mt-auto flex gap-1.5">
                        <span className="h-4 flex-1 rounded-[2px] border border-white/20" />
                        <span className="h-4 flex-1 rounded-[2px] border border-white/20" />
                        <span className="h-4 flex-1 rounded-[2px] border border-white/20" />
                      </span>
                    </span>
                  ) : (
                    <span
                      className="absolute inset-0 rounded-[3px] opacity-25"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, color-mix(in oklab, #ffffff 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, #ffffff 30%, transparent) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="mono-label absolute bottom-0 left-0 text-[var(--fg-mute)]">
            {productName}
          </p>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mono-label absolute right-0 bottom-0 inline-flex cursor-pointer items-center gap-2 border border-[var(--line-strong)] px-3 py-2 transition-colors duration-500 hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          >
            <Icon name={open ? "chevron" : "layers"} size={12} />
            {open ? closeLabel : openLabel}
          </button>
        </div>
      </div>

      {/* The content. */}
      <ol data-stack-layers="" aria-label={label} className="hairline-t lg:col-span-6">
        {STACK_SPINE.map((layer) => {
          const note = notes[layer.id];
          const lifted = active === layer.id;
          return (
            <li key={layer.id} className="hairline-b">
              <button
                type="button"
                onMouseEnter={() => setActive(layer.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(layer.id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(lifted ? null : layer.id)}
                aria-pressed={lifted}
                className="group/layer flex w-full cursor-pointer items-baseline gap-4 py-3.5 text-left md:gap-6"
              >
                <span
                  className={cn(
                    "mono-label shrink-0 transition-colors duration-300",
                    lifted ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                  )}
                >
                  {layer.index}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "display block text-[1.0625rem] tracking-[-0.02em] transition-transform duration-500 ease-[var(--ease-out-expo)]",
                      lifted && "translate-x-1",
                    )}
                  >
                    {t(layer.title, locale)}
                  </span>
                  <span className="mt-1 block max-w-[52ch] text-[var(--fg-dim)]">
                    {t(note ?? layer.generic, locale)}
                  </span>
                </span>
                {note ? (
                  <span className="mono-label shrink-0 self-center text-[var(--accent)] opacity-70">
                    ●
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
