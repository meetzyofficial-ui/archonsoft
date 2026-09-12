import { ScrollFrame } from "@/components/motion/ScrollFrame";
import type { Copy } from "@/i18n/dictionary";

/**
 * Design × Engineering.
 *
 * The one claim this studio makes about itself, and it is made structurally
 * rather than in a paragraph: the two words are set on the same line with the
 * multiplication sign between them, and as the section crosses the screen the
 * first drifts up while the second drifts down — so the sign stays put and the
 * two halves move against it. The typography is the diagram.
 *
 * Everything under it is checkable from this site: three products designed and
 * built by the same hand, a world running in the browser, ten concept
 * interfaces you can open. That is what keeps the section from being the usual
 * unfalsifiable studio boast, and it is the reason the proof list is set at
 * eleven pixels on rules rather than as three big numbers — the claim is that
 * these things exist, not that they are impressive.
 */
export function DesignEngineering({ copy }: { copy: Copy }) {
  return (
    <section
      id="design-engineering"
      data-scheme="haze"
      data-band="haze"
      className="scheme-surface relative overflow-hidden py-28 md:py-40"
    >
      <div className="frame">
        <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
          <span className="mono-micro text-[var(--fg-mute)]">{copy.designEng.label}</span>
          <span className="mono-micro text-[var(--fg-mute)]">{copy.designEng.aside}</span>
        </div>
      </div>

      <ScrollFrame className="mt-16 md:mt-24" enter={0.9}>
        <div className="frame">
          <p className="text-section flex flex-wrap items-baseline gap-x-[0.3em]">
            <span className="drift-up block">{copy.designEng.first}</span>
            <span aria-hidden="true" className="block text-[var(--accent)]">
              ×
            </span>
            <span className="drift-down block text-[var(--fg-mute)]">
              {copy.designEng.second}
            </span>
          </p>
        </div>
      </ScrollFrame>

      <div className="frame mt-20 md:mt-28">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <ScrollFrame className="md:col-span-5">
            <p className="text-quote rise-copy max-w-[26ch]">{copy.designEng.statement}</p>
          </ScrollFrame>

          <ScrollFrame className="md:col-span-5 md:col-start-8">
            <div className="rise-copy">
              <p className="text-lead max-w-[44ch] text-[var(--fg-dim)]">
                {copy.designEng.body}
              </p>
              <ul className="mt-10">
                {copy.designEng.proof.map((line) => (
                  <li key={line} className="hairline-t mono-label py-3 text-[var(--fg-mute)]">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollFrame>
        </div>
      </div>
    </section>
  );
}
