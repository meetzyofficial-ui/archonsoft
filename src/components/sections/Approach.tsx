import { Icon } from "@/components/labs/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ActionLink } from "@/components/ui/Action";
import { Band, SectionRule } from "@/components/ui/primitives";
import { PROCESS } from "@/data/process";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The three bands that turn the site from a portfolio into something a
 * visitor can navigate by their own situation: what are you building, how the
 * work runs, and which layers it touches.
 */

/* ------------------------------------------------------------------ select */

export function ProcessBand({
  locale,
  copy,
  detailed = false,
  withHead = true,
}: {
  locale: Locale;
  copy: Copy;
  /** The full stage on its own page; the short form on the home page. */
  detailed?: boolean;
  withHead?: boolean;
}) {
  const body = (
    <>
      {withHead ? (
        <>
          <SectionRule label={copy.process.label} aside={copy.process.aside} />

          <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
            <h2 className="text-head md:col-span-7">
              <SplitReveal text={copy.process.statement} lineHeight="0.94em" stagger={34} />
              <SplitReveal
                text={[{ text: copy.process.statementAccent }]}
                lineHeight="0.94em"
                stagger={34}
                delay={120}
              />
            </h2>
            <Reveal className="md:col-span-4 md:col-start-9">
              <p className="text-lead text-[var(--fg-dim)]">{copy.process.body}</p>
            </Reveal>
          </div>
        </>
      ) : null}

      <Reveal variant="none" className={withHead ? "mt-14 md:mt-20" : ""}>
        <ol className={cn("hairline-t", detailed ? "" : "lg:grid lg:grid-cols-3")}>
          {PROCESS.map((stage, index) => (
            <li
              key={stage.id}
              className={cn(
                "reveal-fade hairline-b flex flex-col py-7 md:py-9",
                !detailed && "lg:border-l lg:px-6 lg:first:border-l-0 lg:[&:nth-child(4)]:border-l-0",
                detailed && "md:grid md:grid-cols-12 md:gap-8",
              )}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className={detailed ? "md:col-span-4" : ""}>
                <div className="flex items-baseline gap-3">
                  <h3 className="display text-quote">{t(stage.title, locale)}</h3>
                  <Icon
                    name={stage.icon}
                    size={15}
                    className="ml-auto shrink-0 translate-y-1 text-[var(--fg-mute)]"
                  />
                </div>
                <p className="mt-3 max-w-[34ch] text-[var(--fg-dim)]">{t(stage.precis, locale)}</p>
              </div>

              {detailed ? (
                <div className="mt-6 md:col-span-8 md:mt-0">
                  <ul className="max-w-[62ch]">
                    {tl(stage.happens, locale).map((line) => (
                      <li key={line} className="flex gap-3 py-1.5">
                        <span
                          aria-hidden="true"
                          className="mt-[0.7em] block h-px w-3 shrink-0 bg-[var(--accent)]"
                        />
                        <span className="text-[var(--fg-dim)]">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    <div className="hairline-t pt-3">
                      <dt className="mono-label text-[var(--fg-mute)]">{copy.process.output}</dt>
                      <dd className="mt-1.5">{t(stage.output, locale)}</dd>
                    </div>
                    <div className="hairline-t pt-3">
                      <dt className="mono-label text-[var(--fg-mute)]">{copy.process.yours}</dt>
                      <dd className="mt-1.5 text-[var(--fg-dim)]">{t(stage.yours, locale)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="mono-label text-[var(--fg-mute)]">{copy.process.output}</p>
                  <p className="mt-1.5 max-w-[34ch]">{t(stage.output, locale)}</p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Reveal>

      {!detailed ? (
        <Reveal className="mt-12">
          <ActionLink href={localePath(locale, "/process")} variant="line">
            {copy.process.detail}
          </ActionLink>
        </Reveal>
      ) : null}
    </>
  );

  return withHead ? (
    <Band scheme="paper" size="regular" id="process">
      <div className="frame">{body}</div>
    </Band>
  ) : (
    <div className="frame">{body}</div>
  );
}

/* --------------------------------------------------------------------- tech */

