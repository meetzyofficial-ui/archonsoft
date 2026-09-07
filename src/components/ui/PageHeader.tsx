import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Band, ChapterHead } from "@/components/ui/primitives";

/**
 * The masthead every top-level route opens with. Headline on the left seven
 * columns, standfirst on the right four, both settling on the same baseline.
 */
export function PageHeader({
  index = "—",
  title,
  aside,
  lead,
  accent,
  standfirst,
  children,
}: {
  index?: string;
  title: string;
  aside?: string;
  lead: string;
  accent: string;
  standfirst: string;
  children?: ReactNode;
}) {
  return (
    <Band scheme="dark" size="tight" className="pt-[calc(72px+3.5rem)] md:pt-[calc(72px+5.5rem)]">
      <div className="frame">
        <ChapterHead index={index} title={title} aside={aside} />

        <div className="mt-11 grid gap-10 md:mt-16 md:grid-cols-12 md:items-end md:gap-8">
          <h1 className="text-d1 md:col-span-7">
            <SplitReveal text={lead} immediate lineHeight="0.92em" stagger={38} delay={120} />
            <SplitReveal
              text={[{ text: accent, accent: true }]}
              immediate
              lineHeight="0.92em"
              stagger={38}
              delay={240}
            />
          </h1>

          {/* `rise`, not `fade`: this is the largest thing above the fold on
              most routes, and opacity would hold LCP until hydration. */}
          <Reveal variant="rise" className="md:col-span-4 md:col-start-9" delay={200}>
            <p className="text-lead text-[var(--fg-dim)]">{standfirst}</p>
            {children}
          </Reveal>
        </div>
      </div>
    </Band>
  );
}
