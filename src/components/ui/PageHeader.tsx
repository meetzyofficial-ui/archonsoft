import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionRule } from "@/components/ui/primitives";

/**
 * The masthead every top-level route opens with.
 *
 * A rule, the page's name at ten pixels on it, then one sentence in the
 * display serif and a standfirst in the far column. It is deliberately half
 * the height of the old one: that version reserved a screen and a half for a
 * title before any content began, on six routes, and the largest thing on
 * every inner page was the word naming it.
 *
 * Nothing here animates. This block is the first screen of every inner route,
 * so a reveal on it is a reveal nobody sees — and one that is paid for: an
 * element that is still settling cannot be the largest contentful paint until
 * it stops, which on a throttled connection dated a masthead painted at 0.85s
 * to 3.6s. The page opens still; motion starts when you scroll.
 */
export function PageHeader({
  title,
  aside,
  lead,
  accent,
  standfirst,
  children,
}: {
  title: string;
  aside?: string;
  lead: string;
  accent: string;
  standfirst: string;
  children?: ReactNode;
}) {
  return (
    <section
      data-scheme="paper"
      data-band="paper"
      className="pt-[calc(4rem+3rem)] pb-16 md:pt-[calc(4rem+5rem)] md:pb-24"
    >
      <div className="frame">
        <SectionRule label={title} aside={aside} />

        <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end md:gap-8">
          <Reveal variant="rise" priority className="md:col-span-7">
            <h1 className="text-section max-w-[16ch]">
              {lead} <span className="text-[var(--fg-mute)]">{accent}</span>
            </h1>
          </Reveal>

          <Reveal variant="rise" priority className="md:col-span-4 md:col-start-9">
            <p className="text-[var(--fg-mute)]">{standfirst}</p>
            {children}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
