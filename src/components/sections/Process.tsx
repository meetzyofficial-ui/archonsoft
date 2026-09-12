import { Reveal } from "@/components/motion/Reveal";
import { Band, SectionRule } from "@/components/ui/primitives";
import { PROCESS } from "@/data/practice";
import { t, type Locale } from "@/lib/i18n";

/**
 * How the work runs, as four rows on rules.
 *
 * It was four bordered cells in a one-pixel-gutter grid — the one place left
 * on the site where content sat inside a box. A phase of work is not an
 * object; it is an entry in a sequence, and a sequence is a list. The number
 * carries the order, the rule carries the separation, and nothing is
 * enclosed.
 */
export function Process({
  locale,
  title,
  aside,
}: {
  locale: Locale;
  title: string;
  aside: string;
}) {
  return (
    <Band scheme="haze" size="regular">
      <div className="frame">
        <SectionRule label={title} aside={aside} />

        <ol className="mt-12 md:mt-16">
          {PROCESS.map((phase, i) => (
            <li key={phase.index} className="hairline-t">
              <Reveal
                delay={i * 70}
                className="grid gap-x-8 gap-y-3 py-7 md:grid-cols-12 md:py-9"
              >
                <span className="mono-micro reveal-fade text-[var(--accent)] md:col-span-1">
                  {phase.index}
                </span>
                <h3 className="text-sub reveal-fade md:col-span-4">{t(phase.title, locale)}</h3>
                <p className="reveal-fade max-w-[52ch] text-[var(--fg-mute)] md:col-span-6 md:col-start-7">
                  {t(phase.body, locale)}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}
