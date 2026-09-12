"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Diagram, type DiagramKind } from "@/components/system/Diagram";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ActionLink } from "@/components/ui/Action";
import { Band, SectionRule } from "@/components/ui/primitives";
import { EXPERIMENTS, LAB_NOTES } from "@/data/lab";
import type { Copy } from "@/i18n/dictionary";
import { useHasPointer, usePrefersReducedMotion } from "@/lib/hooks";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  index: string;
  title: string;
  status: string;
  running: boolean;
  note: string;
  diagram: DiagramKind;
  href: string;
};

/**
 * A preview panel that trails the pointer over the list. Mounted only for fine
 * pointers with motion allowed; everyone else gets the drawing inline in the
 * row instead, so nothing is lost on a phone.
 */
function FloatingPreview({ item }: { item: Item | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const pointer = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let seen = false;

    const onMove = (event: PointerEvent) => {
      const host = node.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (!seen) {
        seen = true;
        current.x = pointer.x;
        current.y = pointer.y;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const tick = () => {
      current.x += (pointer.x - current.x) * 0.12;
      current.y += (pointer.y - current.y) * 0.12;
      node.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      const settled =
        Math.abs(pointer.x - current.x) < 0.4 && Math.abs(pointer.y - current.y) < 0.4;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-30 w-[24rem] border border-[var(--line-strong)] bg-[var(--bg-raise)]",
        "transition-[opacity,scale] duration-[550ms] ease-[var(--ease-out-expo)]",
        item ? "scale-100 opacity-100" : "scale-95 opacity-0",
      )}
    >
      <div className="aspect-[4/3]">
        {item ? <Diagram kind={item.diagram} label="" className="p-2" showGrid={false} /> : null}
      </div>
      <p className="mono-label hairline-t px-4 py-3 text-[var(--fg-mute)]">
        {item ? `${item.index} — ${item.status}` : ""}
      </p>
    </div>
  );
}

export function NextUp({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const hasPointer = useHasPointer();
  const reduced = usePrefersReducedMotion();
  const floating = hasPointer && !reduced;

  // Composed from the Lab rather than duplicated: the running experiments plus
  // the threads actually being worked. Nothing invented, nothing dressed up as
  // a client project — the standfirst says exactly what these are.
  const items: Item[] = [
    ...EXPERIMENTS.map<Item>((experiment) => ({
      key: `exp-${experiment.id}`,
      index: `EXP ${experiment.id}`,
      title: t(experiment.title, locale),
      status: copy.next.running,
      running: true,
      note: t(experiment.note, locale),
      diagram: experiment.kind,
      href: localePath(locale, `/labs#exp-${experiment.id}`),
    })),
    ...LAB_NOTES.filter((note) => note.status === "IN PROGRESS").map<Item>((note) => ({
      key: note.index,
      index: note.index,
      title: t(note.title, locale),
      status: copy.next.inProgress,
      running: false,
      note: t(note.position, locale),
      diagram: note.diagram,
      href: localePath(locale, "/labs"),
    })),
  ];

  return (
    <Band scheme="paper" size="regular" id="next">
      <div className="frame">
        <SectionRule label={copy.next.label} aside={copy.next.aside} />

        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:items-end md:gap-8">
          <SplitReveal
            as="h2"
            lineHeight="0.98em"
            className="text-sub md:col-span-7"
            text={[
              { text: copy.next.statement },
              { text: copy.next.statementAccent, accent: true },
            ]}
          />
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-[var(--fg-dim)]">{copy.next.body}</p>
          </Reveal>
        </div>
      </div>

      <div
        className="relative mt-14 md:mt-20"
        onMouseLeave={floating ? () => setHovered(null) : undefined}
      >
        {floating ? <FloatingPreview item={hovered === null ? null : items[hovered]!} /> : null}

        <ul className="frame hairline-t">
          {items.map((item, index) => (
            <li key={item.key} className="hairline-b">
              <Link
                href={item.href}
                data-cursor-label={copy.work.open}
                onMouseEnter={floating ? () => setHovered(index) : undefined}
                onFocus={floating ? () => setHovered(index) : undefined}
                className={cn(
                  "group/row grid gap-x-6 gap-y-4 py-6 transition-opacity duration-500 md:grid-cols-12 md:items-center md:py-8",
                  hovered !== null && hovered !== index ? "md:opacity-45" : "opacity-100",
                )}
              >
                <span className="mono-label text-[var(--accent)] md:col-span-2">{item.index}</span>

                <h3 className="text-quote md:col-span-5 md:transition-transform md:duration-[600ms] md:ease-[var(--ease-out-expo)] md:group-hover/row:translate-x-2">
                  {item.title}
                </h3>

                {!floating ? (
                  <div className="border border-[var(--line)] bg-[var(--bg-raise)] md:col-span-3">
                    <div className="aspect-[4/3]">
                      <Diagram kind={item.diagram} label="" className="p-1" showGrid={false} />
                    </div>
                  </div>
                ) : null}

                <p className="max-w-[46ch] text-[var(--fg-dim)] md:col-span-3">{item.note}</p>

                <span className="mono-label md:col-span-2 md:justify-self-end">
                  <span
                    className={cn(
                      "inline-block border px-2.5 py-1.5",
                      item.running
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--line)] text-[var(--fg-mute)]",
                    )}
                  >
                    {item.status}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="frame">
        <Reveal className="mt-10">
          <ActionLink href={localePath(locale, "/labs")} variant="line">
            {copy.next.open}
          </ActionLink>
        </Reveal>
      </div>
    </Band>
  );
}
