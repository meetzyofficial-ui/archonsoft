import { LabsExplorer } from "@/components/labs/LabsExplorer";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ActionLink } from "@/components/ui/Action";
import { Band, ChapterHead } from "@/components/ui/primitives";
import { LABS } from "@/data/labs";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Archon Labs, on the home page.
 *
 * This band exists because of an honest problem: two shipped products is a
 * true answer to what has been released and a poor answer to what can be
 * built. The dishonest fix is to invent eight more clients. The fix taken
 * here is to build eight more products and say plainly that they are
 * concepts — which turns out to be the more convincing answer anyway, because
 * a visitor can open them.
 */
export function LabsBand({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <Band scheme="dark" size="regular" id="labs">
      <div className="frame">
        <ChapterHead
          index={copy.labs.index}
          title={copy.labs.label}
          aside={`${LABS.length} — ${copy.labs.count}`}
        />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 className="text-d1 md:col-span-7">
            <SplitReveal text={copy.labs.statement} lineHeight="0.94em" stagger={34} />
            <SplitReveal
              text={[{ text: copy.labs.statementAccent }]}
              lineHeight="0.94em"
              stagger={34}
              delay={120}
            />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{copy.labs.body}</p>
          </Reveal>
        </div>

        <Reveal variant="none" className="mt-14 md:mt-20">
          <div className="reveal-fade">
            <LabsExplorer locale={locale} copy={copy} />
          </div>
        </Reveal>

        <Reveal className="mt-14 flex flex-wrap gap-3 md:mt-20">
          <ActionLink href={localePath(locale, "/labs")} variant="solid">
            {copy.labs.all}
          </ActionLink>
          <ActionLink href={localePath(locale, "/capabilities")} variant="line">
            {copy.matrix.label}
          </ActionLink>
        </Reveal>
      </div>
    </Band>
  );
}
