import Link from "next/link";
import { Icon } from "@/components/labs/Icon";
import { SystemStack } from "@/components/labs/SystemStack";
import { CapabilityMap } from "@/components/sections/CapabilityMap";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { SelfSelect } from "@/components/sections/SelfSelect";
import { ActionLink } from "@/components/ui/Action";
import { Band, SectionRule } from "@/components/ui/primitives";
import { LAYERS, LAYER_GROUPS, PROCESS } from "@/data/process";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The three bands that turn the site from a portfolio into something a
 * visitor can navigate by their own situation: what are you building, how the
 * work runs, and which layers it touches.
 */

/* ------------------------------------------------------------------ select */

export function SelectBand({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <Band scheme="haze" size="regular" id="build">
      <div className="frame">
        <SectionRule label={copy.select.label} aside={copy.select.aside} />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 className="text-head md:col-span-7">
            <SplitReveal text={copy.select.statement} lineHeight="0.94em" stagger={34} />
            <SplitReveal
              text={[{ text: copy.select.statementAccent }]}
              lineHeight="0.94em"
              stagger={34}
              delay={120}
            />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{copy.select.body}</p>
          </Reveal>
        </div>

        <Reveal variant="none" className="mt-14 md:mt-20">
          <div className="reveal-fade">
            <SelfSelect locale={locale} copy={copy} />
          </div>
        </Reveal>
      </div>
    </Band>
  );
}

/* -------------------------------------------------------------- categories */

export function CategoryBand({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <Band scheme="haze" size="regular" id="build-what">
      <div className="frame">
        <SectionRule label={copy.categories.label} aside={copy.categories.aside} />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 className="text-head md:col-span-7">
            <SplitReveal text={copy.categories.statement} lineHeight="0.94em" stagger={34} />
            <SplitReveal
              text={[{ text: copy.categories.statementAccent }]}
              lineHeight="0.94em"
              stagger={34}
              delay={120}
            />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{copy.categories.body}</p>
          </Reveal>
        </div>

        <Reveal variant="none" className="mt-14 md:mt-20">
          <div className="reveal-fade">
            <CapabilityMap locale={locale} copy={copy} />
          </div>
        </Reveal>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------ system */

/**
 * Why Archon, answered with an object rather than a value statement.
 *
 * The argument is the only one this studio can honestly make against a larger
 * company: not that it is better, but that it is one place. So the band names
 * the gap a client actually falls into — screens from one supplier, a
 * repository from another, and the working product nobody owns — then draws
 * the whole journey as a single line and opens the product to show that the
 * layers under it are real.
 *
 * The stack carries no per-product notes here. It is a claim about method,
 * which is verifiable, rather than about anyone's system, which would not be.
 */
export function SystemBand({ locale, copy }: { locale: Locale; copy: Copy }) {
  const journey = copy.why.journey;

  return (
    <Band scheme="paper" size="regular" id="why">
      <div className="frame">
        <SectionRule label={copy.why.label} aside={copy.why.aside} />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 className="text-head md:col-span-7">
            <SplitReveal text={copy.why.statement} lineHeight="0.94em" stagger={34} />
            <SplitReveal
              text={[{ text: copy.why.statementAccent }]}
              lineHeight="0.94em"
              stagger={34}
              delay={120}
            />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{copy.why.body}</p>
          </Reveal>
        </div>

        {/* The journey, as one line. Eight steps that normally sit in two or
            three companies, printed as a single row so the argument is made
            before a word of it is read. */}
        <Reveal variant="none" className="mt-12 md:mt-16">
          <p className="mono-label reveal-fade text-[var(--fg-mute)]">{copy.why.journeyLabel}</p>
          <ol className="hairline-t mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
            {journey.map((step, index) => {
              const last = index === journey.length - 1;
              return (
                <li
                  key={step}
                  className="reveal-fade hairline-b flex items-baseline gap-2 border-l border-[var(--line)] py-4 pl-3 first:border-l-0 sm:[&:nth-child(5)]:border-l-0 lg:[&:nth-child(5)]:border-l lg:py-5 lg:pl-4"
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  <span
                    className={cn(
                      "mono-label",
                      last ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "display truncate text-[0.9375rem] tracking-[-0.02em] lg:text-[1.0625rem]",
                      last ? "text-[var(--accent)]" : "text-[var(--fg)]",
                    )}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="reveal-fade mt-6 text-lead">{copy.why.kicker}</p>
        </Reveal>

        <Reveal variant="none" className="mt-14 md:mt-20">
          <div className="reveal-fade">
            <SystemStack
              locale={locale}
              notes={{}}
              accent="var(--color-blue-ink)"
              productName={copy.stack.layers}
              label={copy.stack.layers}
              openLabel={copy.stack.open}
              closeLabel={copy.stack.close}
            />
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <ActionLink href={localePath(locale, "/process")} variant="line">
            {copy.why.link}
          </ActionLink>
        </Reveal>
      </div>
    </Band>
  );
}

/* ----------------------------------------------------------------- process */

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
                  <span className="mono-label text-[var(--accent)]">{stage.index}</span>
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

export function TechBand({
  locale,
  copy,
  scheme = "haze",
}: {
  locale: Locale;
  copy: Copy;
  scheme?: "paper" | "haze" | "ink";
}) {
  return (
    <Band scheme={scheme} size="regular" id="layers">
      <div className="frame">
        <SectionRule label={copy.tech.label} aside={copy.tech.aside} />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 className="text-head md:col-span-7">
            <SplitReveal text={copy.tech.statement} lineHeight="0.94em" stagger={34} />
            <SplitReveal
              text={[{ text: copy.tech.statementAccent }]}
              lineHeight="0.94em"
              stagger={34}
              delay={120}
            />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{copy.tech.body}</p>
          </Reveal>
        </div>

        <Reveal variant="none" className="mt-14 md:mt-20">
          <div className="hairline-t">
            {LAYER_GROUPS.map((group, groupIndex) => {
              const layers = LAYERS.filter((layer) => layer.group.en === group);
              return (
                <section
                  key={group}
                  className="reveal-fade hairline-b grid gap-6 py-7 md:grid-cols-12 md:gap-8 md:py-9"
                  style={{ transitionDelay: `${groupIndex * 70}ms` }}
                >
                  <h3 className="mono-label text-[var(--accent)] md:col-span-3">
                    {t(layers[0]!.group, locale)}
                  </h3>
                  <ul className="grid gap-6 md:col-span-9 md:grid-cols-3">
                    {layers.map((layer) => (
                      <li key={layer.id} className="flex flex-col">
                        <h4 className="display text-[1.25rem] tracking-[-0.02em]">
                          {t(layer.title, locale)}
                        </h4>
                        <p className="mt-2 text-[var(--fg-dim)]">{t(layer.detail, locale)}</p>
                        <p className="mono-label mt-auto pt-4 text-[var(--fg-mute)]">
                          {layer.evidence.kind === "site" ? (
                            <span>{copy.tech.thisSite}</span>
                          ) : (
                            <Link
                              href={localePath(
                                locale,
                                layer.evidence.kind === "shipped"
                                  ? `/work/${layer.evidence.slug}`
                                  : `/labs/${layer.evidence.slug}`,
                              )}
                              className="link-rule inline-flex items-center gap-2 hover:text-[var(--fg)]"
                            >
                              <span
                                className={
                                  layer.evidence.kind === "shipped" ? "text-[var(--accent)]" : ""
                                }
                              >
                                {layer.evidence.kind === "shipped"
                                  ? copy.matrix.shipped
                                  : copy.matrix.concept}
                              </span>
                              {t(layer.evidence.name, locale)}
                            </Link>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="reveal-fade mt-8 max-w-[76ch] text-[var(--fg-mute)]">{copy.tech.note}</p>
        </Reveal>
      </div>
    </Band>
  );
}
