import Link from "next/link";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * What Archon is, in five lines, immediately after the opening.
 *
 * The opening says what is made here; this says why it is one studio rather
 * than three suppliers. It is deliberately the smallest chapter on the page —
 * a rule, one sentence in the display serif, two short paragraphs in the far
 * column, and a line out. A studio that explains itself at length in its
 * second screen is a studio with something to prove.
 */
export function StudioStatement({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section
      id="studio"
      data-scheme="paper"
      data-band="paper"
      className="relative pt-32 md:pt-48"
    >
      <div className="frame">
        <ScrollFrame enter={0.45}>
          <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.position.label}
            </span>
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.position.aside}
            </span>
          </div>

          <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
            <h2 className="text-head rise-copy max-w-[18ch] md:col-span-6">
              {copy.position.statement}{" "}
              <span className="text-[var(--accent)]">{copy.position.statementAccent}</span>
            </h2>

            <div className="rise-copy md:col-span-5 md:col-start-8">
              {copy.position.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-[48ch] text-[var(--fg-mute)] not-first:mt-5"
                >
                  {paragraph}
                </p>
              ))}
              <Link
                href={localePath(locale, "/about")}
                className="mono-label link-rule mt-8 inline-block text-[var(--fg-dim)] hover:text-[var(--fg)]"
              >
                {copy.position.link}
              </Link>
            </div>
          </div>
        </ScrollFrame>
      </div>
    </section>
  );
}
