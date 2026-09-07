import { Reveal } from "@/components/motion/Reveal";
import { Band, ChapterHead } from "@/components/ui/primitives";
import { PROCESS } from "@/data/practice";
import { t, type Locale } from "@/lib/i18n";

export function Process({
  locale,
  index = "—",
  title,
  aside,
}: {
  locale: Locale;
  index?: string;
  title: string;
  aside: string;
}) {
  return (
    <Band scheme="light" size="regular">
      <div className="frame">
        <ChapterHead index={index} title={title} aside={aside} />

        <ol className="mt-12 grid gap-px border border-[var(--line)] bg-[var(--line)] md:mt-16 md:grid-cols-4">
          {PROCESS.map((phase, i) => (
            <li key={phase.index} className="scheme-surface">
              <Reveal delay={i * 80} className="flex h-full flex-col p-7 md:p-8">
                <span className="mono-label text-[var(--accent)]">{phase.index}</span>
                <h3 className="mt-6 text-d3">{t(phase.title, locale)}</h3>
                <p className="mt-4 text-[var(--fg-dim)]">{t(phase.body, locale)}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}
